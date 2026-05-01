<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

function ensureQrColumn($conn) {
    $check = $conn->query("SHOW COLUMNS FROM books LIKE 'qr_image_url'");
    if (!$check) {
        return false;
    }
    if ($check->num_rows > 0) {
        return true;
    }
    return $conn->query("ALTER TABLE books ADD COLUMN qr_image_url VARCHAR(500) NULL AFTER available") === true;
}

function ensureCoverColumn($conn) {
    $check = $conn->query("SHOW COLUMNS FROM books LIKE 'cover_image_url'");
    if (!$check) {
        return false;
    }
    if ($check->num_rows > 0) {
        return true;
    }
    return $conn->query("ALTER TABLE books ADD COLUMN cover_image_url VARCHAR(500) NULL AFTER qr_image_url") === true;
}

function ensureIntroColumn($conn) {
    $check = $conn->query("SHOW COLUMNS FROM books LIKE 'intro'");
    if (!$check) {
        return false;
    }
    if ($check->num_rows > 0) {
        return true;
    }
    return $conn->query("ALTER TABLE books ADD COLUMN intro TEXT NULL AFTER cover_image_url") === true;
}

if ($method === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["success" => true]);
    $conn->close();
    exit;
}

switch ($method) {
    case 'GET':
        if (!ensureQrColumn($conn) || !ensureCoverColumn($conn) || !ensureIntroColumn($conn)) {
            echo json_encode(["success" => false, "message" => "Failed to prepare books table columns"]);
            break;
        }
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
        if (!ensureQrColumn($conn) || !ensureCoverColumn($conn) || !ensureIntroColumn($conn)) {
            echo json_encode(["success" => false, "message" => "Failed to prepare books table columns"]);
            break;
        }
        // Add new book
        $data = json_decode(file_get_contents("php://input"), true);
        
        $title = trim($data['title'] ?? '');
        $author = trim($data['author'] ?? '');
        $isbn = trim($data['isbn'] ?? '');
        $category = trim($data['category'] ?? '');
        $quantity = intval($data['quantity'] ?? 1);
        $qrImageUrl = trim($data['qr_image_url'] ?? '');
        $coverImageUrl = trim($data['cover_image_url'] ?? '');
        $intro = trim($data['intro'] ?? '');
        
        if (empty($title) || empty($author)) {
            echo json_encode(["success" => false, "message" => "Title and author are required"]);
            break;
        }
        
        $stmt = $conn->prepare("INSERT INTO books (title, author, isbn, category, quantity, available, qr_image_url, cover_image_url, intro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
            break;
        }
        $stmt->bind_param("ssssiisss", $title, $author, $isbn, $category, $quantity, $quantity, $qrImageUrl, $coverImageUrl, $intro);
        
        if ($stmt->execute()) {
            echo json_encode([
                "success" => true,
                "message" => "Book added successfully",
                "id" => intval($conn->insert_id)
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to add book: " . $stmt->error]);
        }
        
        $stmt->close();
        break;

    case 'PUT':
        if (!ensureQrColumn($conn) || !ensureCoverColumn($conn) || !ensureIntroColumn($conn)) {
            echo json_encode(["success" => false, "message" => "Failed to prepare books table columns"]);
            break;
        }
        // Update book
        $data = json_decode(file_get_contents("php://input"), true);
        
        $id = intval($data['id'] ?? 0);
        $title = trim($data['title'] ?? '');
        $author = trim($data['author'] ?? '');
        $isbn = trim($data['isbn'] ?? '');
        $category = trim($data['category'] ?? '');
        $quantity = intval($data['quantity'] ?? 1);
        $qrImageUrlProvided = array_key_exists('qr_image_url', $data);
        $qrImageUrl = trim($data['qr_image_url'] ?? '');
        $coverImageUrlProvided = array_key_exists('cover_image_url', $data);
        $coverImageUrl = trim($data['cover_image_url'] ?? '');
        $intro = trim($data['intro'] ?? '');

        if ($qrImageUrlProvided && $coverImageUrlProvided) {
            $stmt = $conn->prepare("UPDATE books SET title = ?, author = ?, isbn = ?, category = ?, quantity = ?, available = ?, qr_image_url = ?, cover_image_url = ?, intro = ? WHERE id = ?");
        } else if ($qrImageUrlProvided) {
            $stmt = $conn->prepare("UPDATE books SET title = ?, author = ?, isbn = ?, category = ?, quantity = ?, available = ?, qr_image_url = ?, intro = ? WHERE id = ?");
        } else if ($coverImageUrlProvided) {
            $stmt = $conn->prepare("UPDATE books SET title = ?, author = ?, isbn = ?, category = ?, quantity = ?, available = ?, cover_image_url = ?, intro = ? WHERE id = ?");
        } else {
            $stmt = $conn->prepare("UPDATE books SET title = ?, author = ?, isbn = ?, category = ?, quantity = ?, available = ?, intro = ? WHERE id = ?");
        }
        if (!$stmt) {
            echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
            break;
        }
        if ($qrImageUrlProvided && $coverImageUrlProvided) {
            $stmt->bind_param("ssssiisssi", $title, $author, $isbn, $category, $quantity, $quantity, $qrImageUrl, $coverImageUrl, $intro, $id);
        } else if ($qrImageUrlProvided) {
            $stmt->bind_param("ssssiissi", $title, $author, $isbn, $category, $quantity, $quantity, $qrImageUrl, $intro, $id);
        } else if ($coverImageUrlProvided) {
            $stmt->bind_param("ssssiissi", $title, $author, $isbn, $category, $quantity, $quantity, $coverImageUrl, $intro, $id);
        } else {
            $stmt->bind_param("ssssiisi", $title, $author, $isbn, $category, $quantity, $quantity, $intro, $id);
        }
        
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
