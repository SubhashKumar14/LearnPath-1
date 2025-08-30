CREATE DATABASE IF NOT EXISTS learnpath_db;
USE learnpath_db;

-- =====================================================================
-- CONSOLIDATED LEARNPATH DATABASE SCHEMA
-- Complete schema with all tables, data, and optimizations
-- =====================================================================

SET FOREIGN_KEY_CHECKS=0;

-- Drop all existing tables for clean setup
DROP TABLE IF EXISTS lesson_progress;
DROP TABLE IF EXISTS user_lesson_progress;
DROP TABLE IF EXISTS course_notes;
DROP TABLE IF EXISTS user_courses;
DROP TABLE IF EXISTS course_lessons;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS course_modules;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS certificate_requests;
DROP TABLE IF EXISTS badge_requests;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS user_roadmaps;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS roadmaps;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS=1;

-- =====================================================================
-- CORE TABLES
-- =====================================================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
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
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    UNIQUE KEY uq_user_task (user_id, task_id)
);

CREATE TABLE user_roadmaps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    roadmap_id INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id)
);

-- =====================================================================
-- COURSES SYSTEM
-- =====================================================================

CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
    duration VARCHAR(50) DEFAULT '2 hours',
    category VARCHAR(100),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE course_lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    duration VARCHAR(50),
    order_index INT DEFAULT 1,
    resource_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE user_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    progress INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE KEY uq_user_course (user_id, course_id)
);

CREATE TABLE lesson_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    lesson_id INT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (lesson_id) REFERENCES course_lessons(id),
    UNIQUE KEY uq_user_lesson (user_id, lesson_id)
);

CREATE TABLE course_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- =====================================================================
-- CERTIFICATES AND BADGES SYSTEM
-- =====================================================================

CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_id VARCHAR(100) UNIQUE,
    user_id INT,
    roadmap_id INT NULL,
    course_id INT NULL,
    student_name VARCHAR(255),
    title VARCHAR(255),
    instructor_name VARCHAR(255),
    completion_date DATE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    badge_id VARCHAR(100) UNIQUE,
    user_id INT,
    roadmap_id INT,
    student_name VARCHAR(255),
    roadmap_title VARCHAR(255),
    badge_type ENUM('completion', 'excellence', 'mastery') DEFAULT 'completion',
    completion_date DATE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id)
);

CREATE TABLE certificate_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT NULL,
    roadmap_id INT NULL,
    type ENUM('course', 'roadmap') NOT NULL,
    student_name VARCHAR(255),
    title VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT,
    recipient_name VARCHAR(255) NULL,
    course_name VARCHAR(255) NULL,
    completion_date DATE NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE badge_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    roadmap_id INT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT,
    recipient_name VARCHAR(255) NULL,
    roadmap_name VARCHAR(255) NULL,
    completion_date DATE NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- =====================================================================
-- SESSION SUPPORT
-- =====================================================================

CREATE TABLE sessions (
    session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT COLLATE utf8mb4_bin,
    PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- =====================================================================
-- PERFORMANCE INDEXES
-- =====================================================================

CREATE INDEX idx_user_progress_user_completed ON user_progress(user_id, completed, completed_at);
CREATE INDEX idx_user_roadmaps_user_status ON user_roadmaps(user_id, completed_at);
CREATE INDEX idx_tasks_module_order ON tasks(module_id, order_index);
CREATE INDEX idx_modules_roadmap_order ON modules(roadmap_id, order_index);
CREATE INDEX idx_certificate_requests_status ON certificate_requests(status, requested_at);
CREATE INDEX idx_badge_requests_status ON badge_requests(status, requested_at);
CREATE INDEX idx_user_courses_user_progress ON user_courses(user_id, progress);
CREATE INDEX idx_course_lessons_course_order ON course_lessons(course_id, order_index);
CREATE INDEX idx_lesson_progress_user_lesson ON lesson_progress(user_id, lesson_id);

-- =====================================================================
-- INITIAL DATA
-- =====================================================================

-- Create admin user
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@learnpath.com', '$2b$10$UW6USd49NlM.pyqvgrr/JeLxCLxrXUJ2A0J5ZGhukjTzlr/I1vg6G', 'admin'),
('john_doe', 'john@example.com', '$2b$10$UW6USd49NlM.pyqvgrr/JeLxCLxrXUJ2A0J5ZGhukjTzlr/I1vg6G', 'user');

-- Sample roadmaps
INSERT INTO roadmaps (title, description, difficulty, duration, created_by) VALUES
('AI Ml', 'Roadmap to ai ml', 'Advanced', 51, 1),
('Data Structures & Algorithms', 'Master data structures and algorithms with this comprehensive roadmap. Perfect for coding interviews and strengthening fundamentals.', 'Intermediate', 60, 1),
('Web Development Fundamentals', 'Learn the basics of web development including HTML, CSS, JavaScript and responsive design principles.', 'Beginner', 45, 1),
('Machine Learning Basics', 'Dive into the world of machine learning with Python, TensorFlow, and practical projects.', 'Advanced', 90, 1);

-- Sample modules for roadmaps
INSERT INTO modules (roadmap_id, title, order_index) VALUES
(1, 'Python Fundamentals', 1),
(2, 'Arrays and Strings', 1),
(2, 'Linked Lists', 2),
(2, 'Trees and Graphs', 3),
(3, 'HTML & CSS', 1),
(3, 'JavaScript Basics', 2),
(4, 'Python for ML', 1),
(4, 'Linear Algebra', 2);

-- Sample tasks
INSERT INTO tasks (module_id, title, description, resource_url, order_index) VALUES
(1, 'Variables and Data Types', 'Learn about Python variables and basic data types', 'https://docs.python.org/3/tutorial/', 1),
(2, 'Two Pointers Technique', 'Master the two pointers approach for array problems', 'https://leetcode.com/tag/two-pointers/', 1),
(2, 'String Manipulation', 'Practice common string algorithms', 'https://leetcode.com/tag/string/', 2),
(5, 'HTML Semantic Elements', 'Learn about semantic HTML structure', 'https://developer.mozilla.org/en-US/docs/Web/HTML', 1),
(6, 'ES6 Features', 'Modern JavaScript features and syntax', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', 1);

-- Sample courses
INSERT INTO courses (title, description, difficulty, duration, category, created_by) VALUES
('Frontend Development Mastery', 'Complete course on modern frontend development with React, Vue, and Angular', 'Intermediate', '120 hours', 'Web Development', 1),
('Backend API Development', 'Learn to build robust APIs with Node.js, Express, and databases', 'Advanced', '90 hours', 'Web Development', 1),
('Mobile App Development', 'Create mobile apps using React Native and Flutter', 'Intermediate', '75 hours', 'Mobile Development', 1),
('Python Data Science', 'Introduction to data science with Python and pandas', 'Beginner', '60 hours', 'Data Science', 1),
('Machine Learning Fundamentals', 'Core concepts of machine learning and AI', 'Advanced', '100 hours', 'Data Science', 1);

-- Sample course lessons
INSERT INTO course_lessons (course_id, title, content, duration, order_index, resource_url) VALUES
(1, 'HTML Semantic Elements', 'Learn about semantic HTML elements and their importance in modern web development', '30 min', 1, 'https://www.youtube.com/watch?v=kGW8Al_cga4'),
(1, 'CSS Grid and Flexbox', 'Master modern CSS layout techniques with Grid and Flexbox', '45 min', 2, 'https://www.youtube.com/watch?v=jV8B24rSN5o'),
(1, 'JavaScript ES6+ Features', 'Explore modern JavaScript features and syntax', '60 min', 3, 'https://www.youtube.com/watch?v=WZQc7RUAg18'),
(2, 'Node.js Fundamentals', 'Introduction to Node.js and server-side JavaScript', '45 min', 1, 'https://www.youtube.com/watch?v=TlB_eWDSMt4'),
(2, 'Express.js Framework', 'Building web applications with Express.js', '60 min', 2, 'https://www.youtube.com/watch?v=L72fhGm1tfE'),
(3, 'React Native Basics', 'Getting started with React Native development', '50 min', 1, 'https://www.youtube.com/watch?v=0-S5a0eXPoc'),
(4, 'Python Pandas Introduction', 'Data manipulation with pandas library', '40 min', 1, 'https://www.youtube.com/watch?v=vmEHCJofslg'),
(5, 'Machine Learning Overview', 'Introduction to machine learning concepts', '35 min', 1, 'https://www.youtube.com/watch?v=aircAruvnKk');

-- =====================================================================
-- END OF CONSOLIDATED SCHEMA
-- =====================================================================
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
    -- Optional metadata columns integrated (was separate ALTER)
    recipient_name VARCHAR(255) NULL,
    roadmap_name VARCHAR(255) NULL,
    completion_date DATE NULL,
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
    -- Optional metadata columns integrated (was separate ALTER)
    recipient_name VARCHAR(255) NULL,
    course_name VARCHAR(255) NULL,
    completion_date DATE NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Optional extended metadata columns (idempotent; ignore errors if already exist)

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
ALTER TABLE certificates ADD COLUMN course_id INT NULL AFTER roadmap_id;
ALTER TABLE certificates ADD CONSTRAINT fk_cert_course FOREIGN KEY (course_id) REFERENCES courses(id);

-- Sample course data (optional)
INSERT INTO courses (title, description, difficulty, duration, created_by)
SELECT title, description, difficulty, duration, created_by FROM (
    SELECT 'Frontend Development Mastery' AS title,
           'Complete course on modern frontend development with React, Vue, and Angular' AS description,
           'Intermediate' AS difficulty,
           120 AS duration,
           1 AS created_by
    UNION ALL SELECT 'Backend API Development','Learn to build robust APIs with Node.js, Express, and databases','Advanced',90,1
    UNION ALL SELECT 'Mobile App Development','Create mobile apps using React Native and Flutter','Intermediate',75,1
) AS seed_courses
WHERE NOT EXISTS (SELECT 1 FROM courses);

INSERT INTO course_modules (course_id, title, order_index)
SELECT course_id, title, order_index FROM (
    SELECT 1 AS course_id,'HTML & CSS Fundamentals' AS title,1 AS order_index
    UNION ALL SELECT 1,'JavaScript ES6+',2
    UNION ALL SELECT 1,'React Development',3
    UNION ALL SELECT 2,'Node.js Basics',1
    UNION ALL SELECT 2,'Express Framework',2
    UNION ALL SELECT 2,'Database Integration',3
) AS seed_course_modules
WHERE NOT EXISTS (SELECT 1 FROM course_modules);

INSERT INTO lessons (module_id, title, description, resource_url, order_index)
SELECT module_id, title, description, resource_url, order_index FROM (
    SELECT 1 AS module_id,'HTML Semantic Elements' AS title,'Learn about semantic HTML elements and their importance' AS description,'https://youtube.com/watch?v=html1' AS resource_url,1 AS order_index
    UNION ALL SELECT 1,'CSS Grid and Flexbox','Master modern CSS layout techniques','https://youtube.com/watch?v=css1',2
    UNION ALL SELECT 1,'Responsive Design','Create responsive layouts for all devices','https://youtube.com/watch?v=resp1',3
    UNION ALL SELECT 2,'Variables and Functions','ES6 variables, arrow functions, and more','https://youtube.com/watch?v=js1',1
    UNION ALL SELECT 2,'Async/Await Promises','Handle asynchronous operations in JavaScript','https://youtube.com/watch?v=async1',2
) AS seed_lessons
WHERE NOT EXISTS (SELECT 1 FROM lessons);

-- Admin password fix (from fix-admin.sql) - keeps admin hash in sync
UPDATE users SET password = '$2b$10$UW6USd49NlM.pyqvgrr/JeLxCLxrXUJ2A0J5ZGhukjTzlr/I1vg6G' WHERE email = 'admin@learnpath.com';

-- End of consolidated schema

-- =============================================================
-- Session support & performance indexes (enhanced additions)
-- =============================================================

-- Sessions table for express-mysql-session
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT COLLATE utf8mb4_bin,
    PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Enhanced indexes for better performance
-- Indexes (tables recreated earlier so duplicates won't exist)
CREATE INDEX idx_user_progress_user_completed ON user_progress(user_id, completed, completed_at);
CREATE INDEX idx_user_roadmaps_user_status ON user_roadmaps(user_id, completed_at);
CREATE INDEX idx_tasks_module_order ON tasks(module_id, order_index);
CREATE INDEX idx_modules_roadmap_order ON modules(roadmap_id, order_index);

-- =============================================================
-- COURSES, CERTIFICATES, AND BADGES FUNCTIONALITY
-- =============================================================

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
    duration VARCHAR(50) DEFAULT '2 hours',
    category VARCHAR(100),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Course lessons table
CREATE TABLE IF NOT EXISTS course_lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    duration VARCHAR(50),
    order_index INT DEFAULT 1,
    resource_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- User courses (enrollment tracking)
CREATE TABLE IF NOT EXISTS user_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    progress INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE KEY uq_user_course (user_id, course_id)
);

-- Course notes table
CREATE TABLE IF NOT EXISTS course_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Certificate requests table
CREATE TABLE IF NOT EXISTS certificate_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT NULL,
    roadmap_id INT NULL,
    type ENUM('course', 'roadmap') NOT NULL,
    student_name VARCHAR(255),
    title VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id)
);

-- Enhanced certificates table (update existing)
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS course_id INT NULL AFTER roadmap_id;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_id VARCHAR(100) NULL AFTER id;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS student_name VARCHAR(255) NULL AFTER certificate_id;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL AFTER student_name;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(255) NULL AFTER title;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS completion_date DATE NULL AFTER instructor_name;
ALTER TABLE certificates ADD FOREIGN KEY (course_id) REFERENCES courses(id);

-- Badge requests table
CREATE TABLE IF NOT EXISTS badge_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    roadmap_id INT,
    student_name VARCHAR(255),
    roadmap_title VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id)
);

-- Enhanced user_badges table (update existing)
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS badge_id VARCHAR(100) NULL AFTER id;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS student_name VARCHAR(255) NULL AFTER badge_id;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS roadmap_title VARCHAR(255) NULL AFTER student_name;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS badge_type ENUM('completion', 'excellence', 'mastery') DEFAULT 'completion' AFTER roadmap_title;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS completion_date DATE NULL AFTER badge_type;

-- Sample courses data
INSERT IGNORE INTO courses (id, title, description, difficulty, duration, category, created_by) VALUES
(1, 'JavaScript Fundamentals', 'Master the basics of JavaScript programming', 'Beginner', '4 hours', 'Programming', 1),
(2, 'React for Beginners', 'Learn React.js from scratch', 'Intermediate', '6 hours', 'Web Development', 1),
(3, 'Node.js Backend Development', 'Build scalable backend applications', 'Intermediate', '8 hours', 'Web Development', 1),
(4, 'Python Data Science', 'Introduction to data science with Python', 'Beginner', '10 hours', 'Data Science', 1),
(5, 'Machine Learning Basics', 'Fundamentals of machine learning', 'Advanced', '12 hours', 'Data Science', 1);

-- Sample course lessons
INSERT IGNORE INTO course_lessons (id, course_id, title, content, duration, order_index, resource_url) VALUES
(1, 1, 'Introduction to JavaScript', 'Basic syntax and concepts', '30 min', 1, 'https://example.com/js-intro'),
(2, 1, 'Variables and Data Types', 'Understanding JS variables', '45 min', 2, 'https://example.com/js-variables'),
(3, 1, 'Functions and Scope', 'Working with functions', '60 min', 3, 'https://example.com/js-functions'),
(4, 2, 'React Components', 'Building your first component', '45 min', 1, 'https://example.com/react-components'),
(5, 2, 'State and Props', 'Managing component state', '60 min', 2, 'https://example.com/react-state');

-- Additional indexes for performance
CREATE INDEX idx_certificate_requests_status ON certificate_requests(status, created_at);
CREATE INDEX idx_badge_requests_status ON badge_requests(status, created_at);
CREATE INDEX idx_user_courses_user_progress ON user_courses(user_id, progress);
CREATE INDEX idx_course_lessons_course_order ON course_lessons(course_id, order_index);
