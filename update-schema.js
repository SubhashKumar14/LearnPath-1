const mysql = require('mysql2/promise');
require('dotenv').config();

async function addMissingTables() {
    let connection;
    
    try {
        console.log('🔄 Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '123456',
            database: process.env.DB_NAME || 'learnpath_db'
        });
        
        console.log('✅ Connected to database');
        
        // Add missing tables for badge and certificate requests
        const tables = [
            `CREATE TABLE IF NOT EXISTS badge_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                roadmap_id INT NOT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved_at TIMESTAMP NULL,
                approved_by INT NULL,
                recipient_name VARCHAR(255),
                roadmap_name VARCHAR(255),
                completion_date DATE,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS certificate_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT NOT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved_at TIMESTAMP NULL,
                approved_by INT NULL,
                recipient_name VARCHAR(255),
                course_name VARCHAR(255),
                completion_date DATE,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                difficulty ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
                duration INT,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS course_modules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT,
                title VARCHAR(255) NOT NULL,
                order_index INT,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )`,
            
            `CREATE TABLE IF NOT EXISTS lessons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                module_id INT,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                resource_url VARCHAR(500),
                order_index INT,
                FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
            )`,
            
            `CREATE TABLE IF NOT EXISTS user_courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                course_id INT,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (course_id) REFERENCES courses(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS lesson_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                lesson_id INT,
                completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (lesson_id) REFERENCES lessons(id)
            )`
        ];
        
        console.log('🔄 Adding missing tables...');
        for (const table of tables) {
            await connection.execute(table);
        }
        
        console.log('✅ Missing tables added successfully!');
        
        // Add some sample course data
        const sampleQueries = [
            `INSERT IGNORE INTO courses (title, description, difficulty, duration, created_by) VALUES 
            ('Full Stack Web Development', 'Complete course covering frontend and backend development with modern frameworks.', 'Intermediate', 120, 1),
            ('Python for Data Science', 'Learn Python programming specifically for data analysis and machine learning.', 'Beginner', 90, 1),
            ('Cloud Computing with AWS', 'Master Amazon Web Services and cloud computing fundamentals.', 'Advanced', 150, 1)`,
            
            `INSERT IGNORE INTO course_modules (course_id, title, order_index) VALUES 
            (1, 'Frontend Fundamentals', 1),
            (1, 'Backend Development', 2),
            (1, 'Database Design', 3),
            (2, 'Python Basics', 1),
            (2, 'Data Analysis with Pandas', 2),
            (2, 'Machine Learning', 3)`,
            
            `INSERT IGNORE INTO lessons (module_id, title, description, resource_url, order_index) VALUES 
            (1, 'HTML & CSS Basics', 'Learn the fundamentals of web markup and styling', 'https://youtube.com/watch?v=html101', 1),
            (1, 'JavaScript Fundamentals', 'Master JavaScript programming concepts', 'https://youtube.com/watch?v=js101', 2),
            (1, 'React Introduction', 'Build interactive UIs with React', 'https://youtube.com/watch?v=react101', 3),
            (2, 'Node.js & Express', 'Server-side JavaScript development', 'https://youtube.com/watch?v=node101', 1),
            (2, 'API Development', 'RESTful API design and implementation', 'https://youtube.com/watch?v=api101', 2),
            (3, 'Database Design Principles', 'Learn relational database design', 'https://youtube.com/watch?v=db101', 1)`
        ];
        
        console.log('🔄 Adding sample course data...');
        for (const query of sampleQueries) {
            await connection.execute(query);
        }
        
        console.log('✅ Sample course data added!');
        console.log('📊 Database schema is now complete!');
        
    } catch (error) {
        console.error('❌ Error updating database:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addMissingTables();
