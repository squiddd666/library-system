<?php
// Database configuration
$host = "localhost";
$username = "root";
$password = "";
$database = "library_db";

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["success" => false, "message" => "Database connection failed"]));
}

// Set charset to UTF-8
$conn->set_charset("utf8mb4");

// Set CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
?>
