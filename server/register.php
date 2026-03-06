<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include 'db.php';
require_once __DIR__ . '/mailer.php';
require_once __DIR__ . '/signup_settings_store.php';

const OTP_TTL_SECONDS = 300;
const OTP_MAX_ATTEMPTS = 5;
const OTP_STORE_FILE = __DIR__ . '/tmp/signup_otp_store.json';

function ensureOtpStoreDirectory()
{
    $dir = dirname(OTP_STORE_FILE);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
}

function readOtpStore()
{
    ensureOtpStoreDirectory();
    if (!file_exists(OTP_STORE_FILE)) {
        return [];
    }

    $raw = file_get_contents(OTP_STORE_FILE);
    if ($raw === false || $raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function writeOtpStore($store)
{
    ensureOtpStoreDirectory();
    file_put_contents(OTP_STORE_FILE, json_encode($store, JSON_PRETTY_PRINT));
}

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $action = trim(strtolower($data['action'] ?? ''));
    $first_name = trim($data['first_name'] ?? '');
    $last_name = trim($data['last_name'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $birthday = $data['birthday'] ?? null;
    $gender = $data['gender'] ?? null;
    $otp = trim((string)($data['otp'] ?? ''));

    // Validation
    if (empty($first_name) || empty($last_name) || empty($email) || empty($password)) {
        echo json_encode(["success" => false, "message" => "All fields are required"]);
        exit;
    }

    // Check email domain
    $allowedDomains = ["cvsu.edu.ph", "gmail.com", "yahoo.com"];
    $parts = explode("@", $email);
    if (count($parts) !== 2 || !in_array(strtolower($parts[1]), $allowedDomains)) {
        echo json_encode(["success" => false, "message" => "Email must be cvsu.edu.ph, gmail.com or yahoo.com"]);
        exit;
    }

    // Check password length
    if (strlen($password) < 8 || strlen($password) > 16) {
        echo json_encode(["success" => false, "message" => "Password must be 8 to 16 characters"]);
        exit;
    }

    // Check if email already exists
    $checkStmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $checkStmt->bind_param("s", $email);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Email already registered"]);
        $checkStmt->close();
        exit;
    }
    $checkStmt->close();

    // Default behavior: if no OTP is supplied yet, send OTP first.
    $effectiveAction = $action;
    if ($effectiveAction === '') {
        $effectiveAction = $otp === '' ? 'send_otp' : 'verify_otp';
    }

    $emailVerificationEnabled = isSignupEmailVerificationEnabled();
    if (!$emailVerificationEnabled) {
        $effectiveAction = 'register_direct';
    }

    if ($effectiveAction === 'send_otp') {
        $emailKey = strtolower($email);
        $otpStore = readOtpStore();
        $otpCode = (string) random_int(100000, 999999);
        $otpStore[$emailKey] = [
            'otp_hash' => password_hash($otpCode, PASSWORD_DEFAULT),
            'expires_at' => time() + OTP_TTL_SECONDS,
            'attempts' => 0
        ];
        writeOtpStore($otpStore);

        $mailResult = sendSignupOtpEmail($email, $first_name, $otpCode);
        if (!$mailResult['success']) {
            unset($otpStore[$emailKey]);
            writeOtpStore($otpStore);
            echo json_encode([
                "success" => false,
                "message" => $mailResult['message']
            ]);
            exit;
        }

        echo json_encode([
            "success" => true,
            "otp_required" => true,
            "message" => "OTP sent to your email. It expires in 5 minutes."
        ]);
        exit;
    }

    if ($effectiveAction !== 'verify_otp' && $effectiveAction !== 'register_direct') {
        echo json_encode(["success" => false, "message" => "Invalid action"]);
        exit;
    }

    $emailKey = strtolower($email);
    $otpStore = readOtpStore();

    if ($effectiveAction === 'verify_otp') {
        if ($otp === '' || !preg_match('/^\d{6}$/', $otp)) {
            echo json_encode(["success" => false, "message" => "A valid 6-digit OTP is required"]);
            exit;
        }

        if (!isset($otpStore[$emailKey])) {
            echo json_encode(["success" => false, "message" => "OTP not found. Please request a new OTP."]);
            exit;
        }

        $storedOtp = $otpStore[$emailKey];
        if (($storedOtp['expires_at'] ?? 0) < time()) {
            unset($otpStore[$emailKey]);
            writeOtpStore($otpStore);
            echo json_encode(["success" => false, "message" => "OTP has expired. Please request a new OTP."]);
            exit;
        }

        $attempts = (int)($storedOtp['attempts'] ?? 0);
        if ($attempts >= OTP_MAX_ATTEMPTS) {
            unset($otpStore[$emailKey]);
            writeOtpStore($otpStore);
            echo json_encode(["success" => false, "message" => "Too many invalid OTP attempts. Request a new OTP."]);
            exit;
        }

        if (!password_verify($otp, $storedOtp['otp_hash'] ?? '')) {
            $otpStore[$emailKey]['attempts'] = $attempts + 1;
            writeOtpStore($otpStore);
            echo json_encode(["success" => false, "message" => "Invalid OTP"]);
            exit;
        }
    }

    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Insert user with default role='student'
    $role = 'student';
    $stmt = $conn->prepare("INSERT INTO users (first_name, last_name, email, password, birthday, gender, role) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssss", $first_name, $last_name, $email, $hashed_password, $birthday, $gender, $role);

    if ($stmt->execute()) {
        unset($otpStore[$emailKey]);
        writeOtpStore($otpStore);
        echo json_encode([
            "success" => true,
            "message" => $emailVerificationEnabled ? "Registration successful" : "Registration successful. Email verification is disabled.",
            "otp_required" => false
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Registration failed"]);
    }

    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
?>
