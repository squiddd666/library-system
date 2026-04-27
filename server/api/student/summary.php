<?php
require_once __DIR__ . '/../db.php';

// Validate email parameter
if (!isset($_GET['email']) || empty($_GET['email'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email parameter is required"]);
    exit;
}

$email = filter_var($_GET['email'], FILTER_SANITIZE_EMAIL);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid email format"]);
    exit;
}

// Check if user exists and is a student
$stmt = $conn->prepare("SELECT id, role FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
}

$user = $result->fetch_assoc();
$user_id = $user['id'];
$stmt->close();

// Get total books in library
$stmt = $conn->prepare("SELECT COUNT(*) as total FROM books");
$stmt->execute();
$totalResult = $stmt->get_result()->fetch_assoc();
$totalBooks = $totalResult['total'];
$stmt->close();

// Get borrowed count (ACTIVE status)
$stmt = $conn->prepare("SELECT COUNT(*) as borrowed FROM borrow_transactions WHERE user_id = ? AND status = 'ACTIVE'");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$borrowedResult = $stmt->get_result()->fetch_assoc();
$borrowed = $borrowedResult['borrowed'];
$stmt->close();

// Get returned count (COMPLETED status)
$stmt = $conn->prepare("SELECT COUNT(*) as returned FROM borrow_transactions WHERE user_id = ? AND status = 'COMPLETED'");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$returnedResult = $stmt->get_result()->fetch_assoc();
$returned = $returnedResult['returned'];
$stmt->close();

// Get overdue count
$stmt = $conn->prepare("SELECT COUNT(*) as overdue FROM borrow_transactions WHERE user_id = ? AND status = 'OVERDUE'");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$overdueResult = $stmt->get_result()->fetch_assoc();
$overdue = $overdueResult['overdue'];
$stmt->close();

echo json_encode([
    "success" => true,
    "data" => [
        "totalBooks" => (int)$totalBooks,
        "borrowed" => (int)$borrowed,
        "returned" => (int)$returned,
        "overdue" => (int)$overdue
    ]
]);

$conn->close();
?>
