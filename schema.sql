CREATE DATABASE IF NOT EXISTS learnpath_db;
USE learnpath_db;

DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS user_roadmaps;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS roadmaps;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roadmaps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
    duration INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roadmap_id INT,
    title VARCHAR(255) NOT NULL,
    order_index INT,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_url VARCHAR(500),
    order_index INT,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE TABLE user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    task_id INT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Ensure ON DUPLICATE KEY works for (user_id, task_id)
ALTER TABLE user_progress ADD UNIQUE KEY uq_user_task (user_id, task_id);

CREATE TABLE user_roadmaps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    roadmap_id INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id)
);

CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    roadmap_id INT,
    certificate_url VARCHAR(500),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id)
);

CREATE TABLE badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    roadmap_id INT,
    badge_url VARCHAR(500),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id)
);

INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@learnpath.com', '$2b$10$UW6USd49NlM.pyqvgrr/JeLxCLxrXUJ2A0J5ZGhukjTzlr/I1vg6G', 'admin'),
('johndoe', 'john.doe@example.com', '$2b$10$vOeGU/8FPFJy4F8eELn6SuY7JQ2Y8B4y4F8JY3YJQ4y4F8eELn6Su', 'user');

INSERT INTO roadmaps (title, description, difficulty, duration, created_by) VALUES 
('Data Structures & Algorithms', 'Master data structures and algorithms with this comprehensive roadmap. Perfect for coding interviews and strengthening fundamentals.', 'Intermediate', 60, 1),
('Web Development Fundamentals', 'Learn the basics of web development including HTML, CSS, JavaScript and responsive design principles.', 'Beginner', 45, 1),
('Machine Learning Basics', 'Dive into the world of machine learning with Python, TensorFlow, and practical projects.', 'Advanced', 90, 1);

INSERT INTO modules (roadmap_id, title, order_index) VALUES 
(1, 'Arrays & Strings', 1),
(1, 'Linked Lists', 2),
(1, 'Sorting Algorithms', 3);

INSERT INTO tasks (module_id, title, description, resource_url, order_index) VALUES 
(1, 'Introduction to Arrays', 'Learn about array data structure and its operations', 'https://youtube.com/watch?v=abc123', 1),
(1, 'String Manipulation', 'Master string operations and algorithms', 'https://youtube.com/watch?v=def456', 2),
(1, 'Two Pointer Technique', 'Learn advanced array techniques', 'https://youtube.com/watch?v=ghi789', 3),
(2, 'Singly Linked Lists', 'Understand basic linked list operations', 'https://youtube.com/watch?v=jkl012', 1),
(2, 'Doubly Linked Lists', 'Learn about doubly linked lists', 'https://youtube.com/watch?v=mno345', 2),
(3, 'Bubble Sort', 'Learn the basic sorting algorithm', 'https://youtube.com/watch?v=pqr678', 1),
(3, 'Merge Sort', 'Understand divide and conquer sorting', 'https://youtube.com/watch?v=stu901', 2);

INSERT INTO user_roadmaps (user_id, roadmap_id) VALUES (2, 1);

INSERT INTO user_progress (user_id, task_id, completed, completed_at) VALUES 
(2, 1, TRUE, NOW() - INTERVAL 7 DAY),
(2, 2, TRUE, NOW() - INTERVAL 5 DAY),
(2, 4, TRUE, NOW() - INTERVAL 3 DAY);

-- =============================================================
-- Extended Schema & Optional Features
-- Consolidated from: update-schema.sql, fix-admin.sql, update-schema.js
-- These sections add prototype course & request systems not yet used
-- by the main API (course endpoints not implemented in server.js).
-- Safe to keep (uses IF NOT EXISTS) or remove if unneeded.
-- =============================================================

-- Ensure we are in correct DB
USE learnpath_db;

-- Badge & Certificate Request Tables (prototype request workflow)
CREATE TABLE IF NOT EXISTS badge_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    roadmap_id INT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS certificate_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT, -- Placeholder for future course linkage
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Courses (prototype, not yet exposed via API)
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
    duration INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS course_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    title VARCHAR(255) NOT NULL,
    order_index INT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_url VARCHAR(500),
    order_index INT,
    FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    lesson_id INT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);

-- Add course_id to certificates table if it does not exist (MySQL 8+ syntax may vary)
-- This clause may need manual adjustment if server version lacks IF NOT EXISTS support.
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS course_id INT NULL AFTER roadmap_id;
ALTER TABLE certificates ADD CONSTRAINT fk_cert_course FOREIGN KEY (course_id) REFERENCES courses(id);

-- Sample course data (optional)
INSERT INTO courses (title, description, difficulty, duration, created_by)
SELECT * FROM (
    SELECT 'Frontend Development Mastery','Complete course on modern frontend development with React, Vue, and Angular','Intermediate',120,1
    UNION ALL SELECT 'Backend API Development','Learn to build robust APIs with Node.js, Express, and databases','Advanced',90,1
    UNION ALL SELECT 'Mobile App Development','Create mobile apps using React Native and Flutter','Intermediate',75,1
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM courses);

INSERT INTO course_modules (course_id, title, order_index)
SELECT * FROM (
    SELECT 1,'HTML & CSS Fundamentals',1
    UNION ALL SELECT 1,'JavaScript ES6+',2
    UNION ALL SELECT 1,'React Development',3
    UNION ALL SELECT 2,'Node.js Basics',1
    UNION ALL SELECT 2,'Express Framework',2
    UNION ALL SELECT 2,'Database Integration',3
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM course_modules);

INSERT INTO lessons (module_id, title, description, resource_url, order_index)
SELECT * FROM (
    SELECT 1,'HTML Semantic Elements','Learn about semantic HTML elements and their importance','https://youtube.com/watch?v=html1',1
    UNION ALL SELECT 1,'CSS Grid and Flexbox','Master modern CSS layout techniques','https://youtube.com/watch?v=css1',2
    UNION ALL SELECT 1,'Responsive Design','Create responsive layouts for all devices','https://youtube.com/watch?v=resp1',3
    UNION ALL SELECT 2,'Variables and Functions','ES6 variables, arrow functions, and more','https://youtube.com/watch?v=js1',1
    UNION ALL SELECT 2,'Async/Await Promises','Handle asynchronous operations in JavaScript','https://youtube.com/watch?v=async1',2
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM lessons);

-- Admin password fix (from fix-admin.sql) - keeps admin hash in sync
UPDATE users SET password = '$2b$10$UW6USd49NlM.pyqvgrr/JeLxCLxrXUJ2A0J5ZGhukjTzlr/I1vg6G' WHERE email = 'admin@learnpath.com';

-- End of consolidated schema