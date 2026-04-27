<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include 'db.php';

const LOGIN_SECURITY_STORE_FILE = __DIR__ . '/tmp/login_security_store.json';
const SECURITY_AUDIT_LOG_FILE = __DIR__ . '/tmp/security_audit.log';
const LOGIN_MAX_FAILED_ATTEMPTS = 5;
const LOGIN_LOCK_SECONDS = 600;
const LOGIN_RATE_WINDOW_SECONDS = 60;
const LOGIN_MAX_RATE_PER_WINDOW = 20;

function ensureSecurityDirectory()
{
    $dir = dirname(LOGIN_SECURITY_STORE_FILE);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
}

function defaultLoginSecurityStore()
{
    return [
        'emails' => [],
        'ips' => []
    ];
}

function readLoginSecurityStore()
{
    ensureSecurityDirectory();
    if (!file_exists(LOGIN_SECURITY_STORE_FILE)) {
        return defaultLoginSecurityStore();
    }

    $raw = file_get_contents(LOGIN_SECURITY_STORE_FILE);
    if ($raw === false || trim($raw) === '') {
        return defaultLoginSecurityStore();
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return defaultLoginSecurityStore();
    }

    if (!isset($decoded['emails']) || !is_array($decoded['emails'])) {
        $decoded['emails'] = [];
    }
    if (!isset($decoded['ips']) || !is_array($decoded['ips'])) {
        $decoded['ips'] = [];
    }

    return $decoded;
}

function writeLoginSecurityStore($store)
{
    ensureSecurityDirectory();
    file_put_contents(LOGIN_SECURITY_STORE_FILE, json_encode($store, JSON_PRETTY_PRINT));
}

function getClientIp()
{
    $candidates = [
        $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
        $_SERVER['HTTP_CLIENT_IP'] ?? '',
        $_SERVER['REMOTE_ADDR'] ?? ''
    ];

    foreach ($candidates as $candidate) {
        if ($candidate === '') continue;
        $parts = explode(',', $candidate);
        $ip = trim($parts[0]);
        if ($ip !== '') {
            return $ip;
        }
    }

    return 'unknown';
}

function normalizeWindow($hits, $now)
{
    if (!is_array($hits)) return [];
    return array_values(array_filter($hits, function ($ts) use ($now) {
        return ($now - (int)$ts) <= LOGIN_RATE_WINDOW_SECONDS;
    }));
}

function ensureIdentityState($state)
{
    if (!is_array($state)) {
        $state = [];
    }
    if (!isset($state['failed_attempts'])) {
        $state['failed_attempts'] = 0;
    }
    if (!isset($state['locked_until'])) {
        $state['locked_until'] = 0;
    }
    if (!isset($state['window_hits']) || !is_array($state['window_hits'])) {
        $state['window_hits'] = [];
    }
    return $state;
}

function appendSecurityAuditLog($event, $email, $ip, $details = [])
{
    ensureSecurityDirectory();
    $entry = [
        'time' => gmdate('c'),
        'event' => $event,
        'email_hash' => hash('sha256', strtolower($email)),
        'ip' => $ip,
        'details' => $details
    ];
    file_put_contents(SECURITY_AUDIT_LOG_FILE, json_encode($entry) . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function invalidCredentialsResponse($extra = [])
{
    echo json_encode(array_merge([
        'success' => false,
        'message' => 'Invalid email or password.'
    ], $extra));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    $conn->close();
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    $data = [];
}

$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
$ip = getClientIp();
$now = time();

if ($email === '' || $password === '') {
    echo json_encode(['success' => false, 'message' => 'Email and password are required']);
    $conn->close();
    exit;
}

$allowedDomains = ['cvsu.edu.ph', 'gmail.com', 'yahoo.com'];
$parts = explode('@', $email);
if (count($parts) !== 2 || !in_array(strtolower($parts[1]), $allowedDomains)) {
    invalidCredentialsResponse();
    $conn->close();
    exit;
}

if (strlen($password) < 8 || strlen($password) > 16) {
    invalidCredentialsResponse();
    $conn->close();
    exit;
}

$emailKey = strtolower($email);
$store = readLoginSecurityStore();
$emailState = ensureIdentityState($store['emails'][$emailKey] ?? []);
$ipState = ensureIdentityState($store['ips'][$ip] ?? []);

$emailState['window_hits'] = normalizeWindow($emailState['window_hits'], $now);
$ipState['window_hits'] = normalizeWindow($ipState['window_hits'], $now);

$stmt = $conn->prepare('SELECT id, first_name, last_name, email, password, role, affiliation, institution_id FROM users WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->num_rows > 0 ? $result->fetch_assoc() : null;
$stmt->close();

if ($user && password_verify($password, $user['password'])) {
    $emailState['failed_attempts'] = 0;
    $emailState['locked_until'] = 0;
    $ipState['failed_attempts'] = 0;
    $ipState['locked_until'] = 0;
    $store['emails'][$emailKey] = $emailState;
    $store['ips'][$ip] = $ipState;
    writeLoginSecurityStore($store);
    appendSecurityAuditLog('login_success', $email, $ip, ['role' => $user['role']]);

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => $user['id'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'affiliation' => $user['affiliation'] ?? 'student',
            'institution_id' => $user['institution_id'] ?? null
        ]
    ]);
    $conn->close();
    exit;
}

if (($emailState['locked_until'] ?? 0) > $now || ($ipState['locked_until'] ?? 0) > $now) {
    $remaining = max((int)$emailState['locked_until'] - $now, (int)$ipState['locked_until'] - $now);
    appendSecurityAuditLog('login_locked_block', $email, $ip, ['remaining_seconds' => $remaining]);
    echo json_encode([
        'success' => false,
        'message' => 'Too many failed attempts. Try again later.',
        'retry_after_seconds' => $remaining
    ]);
    $conn->close();
    exit;
}

if (count($emailState['window_hits']) >= LOGIN_MAX_RATE_PER_WINDOW || count($ipState['window_hits']) >= LOGIN_MAX_RATE_PER_WINDOW) {
    $emailState['locked_until'] = $now + LOGIN_LOCK_SECONDS;
    $ipState['locked_until'] = $now + LOGIN_LOCK_SECONDS;
    $store['emails'][$emailKey] = $emailState;
    $store['ips'][$ip] = $ipState;
    writeLoginSecurityStore($store);
    appendSecurityAuditLog('login_rate_limited', $email, $ip, []);
    echo json_encode([
        'success' => false,
        'message' => 'Too many failed attempts. Try again later.',
        'retry_after_seconds' => LOGIN_LOCK_SECONDS
    ]);
    $conn->close();
    exit;
}

$emailState['window_hits'][] = $now;
$ipState['window_hits'][] = $now;

$emailState['failed_attempts'] = (int)$emailState['failed_attempts'] + 1;
$ipState['failed_attempts'] = (int)$ipState['failed_attempts'] + 1;

if ($emailState['failed_attempts'] >= LOGIN_MAX_FAILED_ATTEMPTS || $ipState['failed_attempts'] >= LOGIN_MAX_FAILED_ATTEMPTS) {
    $emailState['locked_until'] = $now + LOGIN_LOCK_SECONDS;
    $ipState['locked_until'] = $now + LOGIN_LOCK_SECONDS;
    appendSecurityAuditLog('login_suspicious_lockout', $email, $ip, [
        'email_failed_attempts' => $emailState['failed_attempts'],
        'ip_failed_attempts' => $ipState['failed_attempts']
    ]);
}

$store['emails'][$emailKey] = $emailState;
$store['ips'][$ip] = $ipState;
writeLoginSecurityStore($store);
appendSecurityAuditLog('login_failed', $email, $ip, [
    'email_failed_attempts' => $emailState['failed_attempts'],
    'ip_failed_attempts' => $ipState['failed_attempts']
]);

if (($emailState['locked_until'] ?? 0) > $now || ($ipState['locked_until'] ?? 0) > $now) {
    $remaining = max((int)$emailState['locked_until'] - $now, (int)$ipState['locked_until'] - $now);
    echo json_encode([
        'success' => false,
        'message' => 'Too many failed attempts. Try again later.',
        'retry_after_seconds' => $remaining
    ]);
} else {
    invalidCredentialsResponse();
}

$conn->close();
?>
