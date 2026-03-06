<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["success" => true]);
    $conn->close();
    exit;
}

switch ($method) {
    case 'GET':
        // Get all books
        $result = $conn->query("SELECT * FROM books ORDER BY title");
        if (!$result) {
            echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
            break;
        }
        $books = [];
        
        while ($row = $result->fetch_assoc()) {
            $books[] = $row;
        }
        
        echo json_encode(["success" => true, "books" => $books]);
        break;

    case 'POST':
        // Add new book
        $data = json_decode(file_get_contents("php://input"), true);
        
        $title = trim($data['title'] ?? '');
        $author = trim($data['author'] ?? '');
        $isbn = trim($data['isbn'] ?? '');
        $category = trim($data['category'] ?? '');
        $quantity = intval($data['quantity'] ?? 1);
        
        if (empty($title) || empty($author)) {
            echo json_encode(["success" => false, "message" => "Title and author are required"]);
            break;
        }
        
        $stmt = $conn->prepare("INSERT INTO books (title, author, isbn, category, quantity, available) VALUES (?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
            break;
        }
        $stmt->bind_param("ssssii", $title, $author, $isbn, $category, $quantity, $quantity);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Book added successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to add book: " . $stmt->error]);
        }
        
        $stmt->close();
        break;

    case 'PUT':
        // Update book
        $data = json_decode(file_get_contents("php://input"), true);
        
        $id = intval($data['id'] ?? 0);
        $title = trim($data['title'] ?? '');
        $author = trim($data['author'] ?? '');
        $isbn = trim($data['isbn'] ?? '');
        $category = trim($data['category'] ?? '');
        $quantity = intval($data['quantity'] ?? 1);
        
        $stmt = $conn->prepare("UPDATE books SET title = ?, author = ?, isbn = ?, category = ?, quantity = ?, available = ? WHERE id = ?");
        if (!$stmt) {
            echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
            break;
        }
        $stmt->bind_param("ssssiii", $title, $author, $isbn, $category, $quantity, $quantity, $id);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Book updated successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update book: " . $stmt->error]);
        }
        
        $stmt->close();
        break;

    case 'DELETE':
        // Delete book
        $id = intval($_GET['id'] ?? 0);
        
        $stmt = $conn->prepare("DELETE FROM books WHERE id = ?");
        if (!$stmt) {
            echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
            break;
        }
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Book deleted successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete book: " . $stmt->error]);
        }
        
        $stmt->close();
        break;

    default:
        echo json_encode(["success" => false, "message" => "Invalid request method"]);
        break;
}

$conn->close();
?>
