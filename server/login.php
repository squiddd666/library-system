<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include 'db.php';

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    // Validation
    if (empty($email) || empty($password)) {
        echo json_encode(["success" => false, "message" => "Email and password are required"]);
        exit;
    }

    // Check email domain
    $allowedDomains = ["cvsu.edu.ph", "gmail.com", "yahoo.com"];
    $parts = explode("@", $email);
    if (count($parts) !== 2 || !in_array(strtolower($parts[1]), $allowedDomains)) {
        echo json_encode(["success" => false, "message" => "Invalid email domain"]);
        exit;
    }

    // Check password length
    if (strlen($password) < 8 || strlen($password) > 16) {
        echo json_encode(["success" => false, "message" => "Password must be 8 to 16 characters"]);
        exit;
    }

    // Get user from database (including role)
    $stmt = $conn->prepare("SELECT id, first_name, last_name, email, password, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        
        // Verify password
        if (password_verify($password, $user['password'])) {
            echo json_encode([
                "success" => true, 
                "message" => "Login successful",
                "user" => [
                    "id" => $user['id'],
                    "first_name" => $user['first_name'],
                    "last_name" => $user['last_name'],
                    "email" => $user['email'],
                    "role" => $user['role']
                ]
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid password"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Email not found"]);
    }

    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
?>
