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
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to UTF-8
$conn->set_charset("utf8mb4");

// For XAMPP, create database if not exists
$sql = "CREATE DATABASE IF NOT EXISTS $database";
if ($conn->query($sql) === TRUE) {
    // Select the database
    $conn->select_db($database);
}

function ensureUsersTableColumns($conn)
{
    $columns = [];
    $result = $conn->query("SHOW COLUMNS FROM users");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $columns[$row['Field']] = true;
        }
        $result->free();
    }

    if (!isset($columns['role'])) {
        $conn->query("ALTER TABLE users ADD COLUMN role ENUM('student', 'admin') DEFAULT 'student'");
    }
    if (!isset($columns['affiliation'])) {
        $conn->query("ALTER TABLE users ADD COLUMN affiliation ENUM('student', 'faculty', 'staff') DEFAULT 'student'");
    }
    if (!isset($columns['institution_id'])) {
        $conn->query("ALTER TABLE users ADD COLUMN institution_id VARCHAR(20) NULL");
    }
}

ensureUsersTableColumns($conn);
?>
