<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

const SECURITY_AUDIT_LOG_FILE = __DIR__ . '/tmp/security_audit.log';
const SECURITY_LOG_LIMIT = 120;

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

if (!file_exists(SECURITY_AUDIT_LOG_FILE)) {
    echo json_encode(['success' => true, 'logs' => []]);
    exit;
}

$raw = @file(SECURITY_AUDIT_LOG_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
if ($raw === false) {
    echo json_encode(['success' => false, 'message' => 'Unable to read security logs']);
    exit;
}

$slice = array_slice($raw, -SECURITY_LOG_LIMIT);
$entries = [];
for ($i = count($slice) - 1; $i >= 0; $i--) {
    $decoded = json_decode($slice[$i], true);
    if (is_array($decoded)) {
        $entries[] = $decoded;
    }
}

echo json_encode([
    'success' => true,
    'logs' => $entries
]);
?>
