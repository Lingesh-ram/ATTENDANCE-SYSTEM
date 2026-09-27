CREATE DATABASE IF NOT EXISTS student_attendance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_attendance;

CREATE TABLE IF NOT EXISTS users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 username VARCHAR(80) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 role ENUM('student','staff','admin') NOT NULL,
 full_name VARCHAR(150) NOT NULL,
 email VARCHAR(180),
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT NOT NULL UNIQUE,
 student_code VARCHAR(40) NOT NULL UNIQUE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staff (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT NOT NULL UNIQUE,
 staff_code VARCHAR(40) NOT NULL UNIQUE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
 id INT AUTO_INCREMENT PRIMARY KEY,
 course_code VARCHAR(40) NOT NULL UNIQUE,
 course_name VARCHAR(150) NOT NULL,
 staff_id INT,
 latitude DECIMAL(10,7),
 longitude DECIMAL(10,7),
 FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS enrollments (
 id INT AUTO_INCREMENT PRIMARY KEY,
 student_id INT NOT NULL,
 course_id INT NOT NULL,
 UNIQUE KEY uq_enrollment(student_id,course_id),
 FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
 FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
 id INT AUTO_INCREMENT PRIMARY KEY,
 course_id INT NOT NULL,
 started_by INT NOT NULL,
 started_at DATETIME NOT NULL,
 expires_at DATETIME NOT NULL,
 closed_at DATETIME NULL,
 status ENUM('active','closed','expired') NOT NULL DEFAULT 'active',
 FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
 FOREIGN KEY(started_by) REFERENCES users(id) ON DELETE CASCADE,
 INDEX idx_session_status(status,expires_at)
);

CREATE TABLE IF NOT EXISTS attendance (
 id INT AUTO_INCREMENT PRIMARY KEY,
 session_id INT NOT NULL,
 student_id INT NOT NULL,
 status ENUM('present','absent') NOT NULL,
 marked_at DATETIME NOT NULL,
 latitude DECIMAL(10,7),
 longitude DECIMAL(10,7),
 UNIQUE KEY uq_attendance(session_id,student_id),
 FOREIGN KEY(session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
 FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 actor_user_id INT NULL,
 action VARCHAR(100) NOT NULL,
 details TEXT,
 ip_address VARCHAR(64),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
 INDEX idx_audit_created(created_at)
);