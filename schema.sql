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
('admin', 'admin@learnpath.com', '$2b$10$vOeGU/8FPFJy4F8eELn6SuY7JQ2Y8B4y4F8JY3YJQ4y4F8eELn6Su', 'admin'),
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