-- Add role column to users table
ALTER TABLE users ADD COLUMN role ENUM('student', 'admin') DEFAULT 'student';

-- To update existing users to have 'student' role (if needed)
UPDATE users SET role = 'student' WHERE role IS NULL;

-- To create an admin user manually (example)
-- INSERT INTO users (first_name, last_name, email, password, role) 
-- VALUES ('Admin', 'User', 'admin@example.com', '$2y$10$...hashed_password...', 'admin');
