CREATE DATABASE IF NOT EXISTS learnpath_db;
USE learnpath_db;

-- =====================================================================
-- CLEAN LEARNPATH DATABASE SCHEMA
-- Fixed duplicate tables and ensured proper user-wise progress tracking
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
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

CREATE TABLE sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT
);

CREATE TABLE roadmaps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roadmap_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INT DEFAULT 1,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_url VARCHAR(500),
    order_index INT DEFAULT 1,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE TABLE user_roadmaps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    roadmap_id INT,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id),
    UNIQUE KEY uq_user_roadmap (user_id, roadmap_id)
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
    instructor VARCHAR(255),
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
    progress INT DEFAULT 0,
    completed_at TIMESTAMP NULL,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_lesson (user_id, lesson_id)
);

CREATE TABLE course_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE KEY uq_user_course_notes (user_id, course_id)
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
    certificate_url VARCHAR(500) NULL,
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
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    student_name VARCHAR(255),
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT,
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
    student_name VARCHAR(255),
    roadmap_title VARCHAR(255),
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- =====================================================================
-- SAMPLE DATA
-- =====================================================================

-- Insert sample users
INSERT INTO users (id, username, email, password, role) VALUES 
(1, 'admin', 'admin@learnpath.com', '$2b$10$8K1p/a9H1HxxtK.VGpG.L.L8k1x3G6S8b1N.fOX1r4z9c5z3L3Nh6', 'admin'),
(2, 'john_doe', 'john@example.com', '$2b$10$8K1p/a9H1HxxtK.VGpG.L.L8k1x3G6S8b1N.fOX1r4z9c5z3L3Nh6', 'user'),
(3, 'jane_smith', 'jane@example.com', '$2b$10$8K1p/a9H1HxxtK.VGpG.L.L8k1x3G6S8b1N.fOX1r4z9c5z3L3Nh6', 'user');

-- Insert sample roadmaps
INSERT INTO roadmaps (id, title, description) VALUES 
(1, 'Web Development Fundamentals', 'Learn the basics of web development'),
(2, 'Data Structures and Algorithms', 'Master fundamental computer science concepts'),
(3, 'Machine Learning Basics', 'Introduction to machine learning concepts');

-- Insert sample modules
INSERT INTO modules (id, roadmap_id, title, description, order_index) VALUES 
(1, 1, 'HTML & CSS Basics', 'Learn the foundation of web development', 1),
(2, 1, 'JavaScript Fundamentals', 'Master JavaScript programming', 2),
(3, 1, 'React.js Introduction', 'Learn modern frontend development', 3),
(4, 2, 'Arrays and Lists', 'Understand linear data structures', 1),
(5, 2, 'Trees and Graphs', 'Learn hierarchical data structures', 2),
(6, 2, 'Sorting Algorithms', 'Master sorting techniques', 3);

-- Insert sample tasks
INSERT INTO tasks (id, module_id, title, description, resource_url, order_index) VALUES 
(1, 1, 'HTML Structure', 'Learn HTML document structure', 'https://youtube.com/watch?v=abc123', 1),
(2, 1, 'CSS Styling', 'Master CSS fundamentals', 'https://youtube.com/watch?v=def456', 2),
(3, 2, 'Variables and Functions', 'Understand JavaScript basics', 'https://youtube.com/watch?v=ghi789', 1),
(4, 2, 'DOM Manipulation', 'Learn to interact with web pages', 'https://youtube.com/watch?v=jkl012', 2),
(5, 4, 'Array Operations', 'Master array manipulation', 'https://youtube.com/watch?v=mno345', 1),
(6, 5, 'Binary Trees', 'Understand tree structures', 'https://youtube.com/watch?v=pqr678', 1);

-- Insert sample courses
INSERT INTO courses (id, title, description, difficulty, duration, category, instructor, created_by) VALUES
(1, 'JavaScript Fundamentals', 'Master the basics of JavaScript programming', 'Beginner', '4 hours', 'Programming', 'John Smith', 1),
(2, 'React for Beginners', 'Learn React.js from scratch', 'Intermediate', '6 hours', 'Web Development', 'Jane Doe', 1),
(3, 'Node.js Backend Development', 'Build scalable backend applications', 'Intermediate', '8 hours', 'Web Development', 'Mike Johnson', 1),
(4, 'Python Data Science', 'Introduction to data science with Python', 'Beginner', '10 hours', 'Data Science', 'Sarah Wilson', 1),
(5, 'Machine Learning Basics', 'Fundamentals of machine learning', 'Advanced', '12 hours', 'Data Science', 'David Brown', 1);

-- Insert sample course lessons
INSERT INTO course_lessons (id, course_id, title, content, duration, order_index, resource_url) VALUES
(1, 1, 'Introduction to JavaScript', 'Basic syntax and concepts of JavaScript', '30 min', 1, 'https://example.com/js-intro'),
(2, 1, 'Variables and Data Types', 'Understanding JavaScript variables and data types', '45 min', 2, 'https://example.com/js-variables'),
(3, 1, 'Functions and Scope', 'Working with functions and understanding scope', '60 min', 3, 'https://example.com/js-functions'),
(4, 1, 'Control Structures', 'Loops and conditional statements', '45 min', 4, 'https://example.com/js-control'),
(5, 2, 'React Components', 'Building your first React component', '45 min', 1, 'https://example.com/react-components'),
(6, 2, 'State and Props', 'Managing component state and props', '60 min', 2, 'https://example.com/react-state'),
(7, 2, 'Event Handling', 'Handling user interactions in React', '50 min', 3, 'https://example.com/react-events'),
(8, 3, 'Node.js Basics', 'Introduction to Node.js runtime', '40 min', 1, 'https://example.com/node-basics'),
(9, 3, 'Express.js Framework', 'Building REST APIs with Express', '70 min', 2, 'https://example.com/express-api');

-- Insert sample enrollments
INSERT INTO user_roadmaps (user_id, roadmap_id) VALUES 
(2, 1),
(2, 2),
(3, 1),
(3, 3);

INSERT INTO user_courses (user_id, course_id, progress) VALUES 
(2, 1, 75),
(2, 2, 30),
(3, 1, 100),
(3, 4, 60);

-- Insert sample progress
INSERT INTO user_progress (user_id, task_id, completed, completed_at) VALUES 
(2, 1, TRUE, NOW() - INTERVAL 7 DAY),
(2, 2, TRUE, NOW() - INTERVAL 5 DAY),
(2, 3, TRUE, NOW() - INTERVAL 3 DAY),
(3, 1, TRUE, NOW() - INTERVAL 10 DAY),
(3, 2, TRUE, NOW() - INTERVAL 8 DAY);

-- Insert sample lesson progress
INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at) VALUES 
(2, 1, TRUE, NOW() - INTERVAL 5 DAY),
(2, 2, TRUE, NOW() - INTERVAL 4 DAY),
(2, 3, TRUE, NOW() - INTERVAL 3 DAY),
(2, 5, TRUE, NOW() - INTERVAL 2 DAY),
(3, 1, TRUE, NOW() - INTERVAL 6 DAY),
(3, 2, TRUE, NOW() - INTERVAL 5 DAY),
(3, 3, TRUE, NOW() - INTERVAL 4 DAY),
(3, 4, TRUE, NOW() - INTERVAL 3 DAY);

-- =====================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_user_roadmaps_user ON user_roadmaps(user_id);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_task ON user_progress(task_id);
CREATE INDEX idx_user_courses_user ON user_courses(user_id);
CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_certificate_requests_status ON certificate_requests(status, requested_at);
CREATE INDEX idx_badge_requests_status ON badge_requests(status, requested_at);
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_badges_user ON badges(user_id);
CREATE INDEX idx_course_lessons_course ON course_lessons(course_id, order_index);

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
