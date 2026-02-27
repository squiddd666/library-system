<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include 'db.php';

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $first_name = trim($data['first_name'] ?? '');
    $last_name = trim($data['last_name'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $birthday = $data['birthday'] ?? null;
    $gender = $data['gender'] ?? null;

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
        exit;
    }

    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Insert user with default role='student'
    $role = 'student';
    $stmt = $conn->prepare("INSERT INTO users (first_name, last_name, email, password, birthday, gender, role) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssss", $first_name, $last_name, $email, $hashed_password, $birthday, $gender, $role);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Registration successful"]);
    } else {
        echo json_encode(["success" => false, "message" => "Registration failed"]);
    }

    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
?>
