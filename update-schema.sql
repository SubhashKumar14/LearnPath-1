-- Additional tables for badge and certificate request system
USE learnpath_db;

-- Badge requests table
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

-- Certificate requests table  
CREATE TABLE IF NOT EXISTS certificate_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT, -- This will be used when we add courses
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Courses table (missing from original schema)
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

-- Course modules table
CREATE TABLE IF NOT EXISTS course_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    title VARCHAR(255) NOT NULL,
    order_index INT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Lessons table (instead of tasks for courses)
CREATE TABLE IF NOT EXISTS lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_url VARCHAR(500),
    order_index INT,
    FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
);

-- User courses table
CREATE TABLE IF NOT EXISTS user_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Update certificates table to support courses
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS course_id INT AFTER roadmap_id;
ALTER TABLE certificates ADD CONSTRAINT fk_cert_course FOREIGN KEY (course_id) REFERENCES courses(id);

-- Insert sample courses
INSERT INTO courses (title, description, difficulty, duration, created_by) VALUES 
('Frontend Development Mastery', 'Complete course on modern frontend development with React, Vue, and Angular', 'Intermediate', 120, 1),
('Backend API Development', 'Learn to build robust APIs with Node.js, Express, and databases', 'Advanced', 90, 1),
('Mobile App Development', 'Create mobile apps using React Native and Flutter', 'Intermediate', 75, 1);

-- Insert course modules
INSERT INTO course_modules (course_id, title, order_index) VALUES 
(1, 'HTML & CSS Fundamentals', 1),
(1, 'JavaScript ES6+', 2),
(1, 'React Development', 3),
(2, 'Node.js Basics', 1),
(2, 'Express Framework', 2),
(2, 'Database Integration', 3);

-- Insert lessons
INSERT INTO lessons (module_id, title, description, resource_url, order_index) VALUES 
(1, 'HTML Semantic Elements', 'Learn about semantic HTML elements and their importance', 'https://youtube.com/watch?v=html1', 1),
(1, 'CSS Grid and Flexbox', 'Master modern CSS layout techniques', 'https://youtube.com/watch?v=css1', 2),
(1, 'Responsive Design', 'Create responsive layouts for all devices', 'https://youtube.com/watch?v=resp1', 3),
(2, 'Variables and Functions', 'ES6 variables, arrow functions, and more', 'https://youtube.com/watch?v=js1', 1),
(2, 'Async/Await Promises', 'Handle asynchronous operations in JavaScript', 'https://youtube.com/watch?v=async1', 2);
