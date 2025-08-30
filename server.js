const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
require('dotenv').config(); // Load env first

// Import DB BEFORE creating session store so pool exists
const { pool, testConnection } = require('./db');

// Session store configuration (created after pool is available)
const sessionStore = new MySQLStore({
    expiration: 86400000,
    createDatabaseTable: true,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
}, pool);
const { authenticateToken, optionalAuthentication, requireAdmin, JWT_SECRET } = require('./auth_middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

// Session middleware
app.use(session({
    key: 'learnpath_session',
    secret: process.env.SESSION_SECRET || 'learnpath_session_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 86400000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Test database connection
testConnection();

// Enhanced error handler
const handleError = (res, error, message = 'Internal server error', statusCode = 500) => {
    console.error(`Error: ${message}`, error);
    return res.status(statusCode).json({ 
        error: message,
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
};

// Input validation middleware
const validateInput = (fields) => {
    return (req, res, next) => {
        const errors = [];
        fields.forEach(field => {
            if (!req.body[field] || req.body[field].toString().trim() === '') {
                errors.push(`${field} is required`);
            }
        });
        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(', ') });
        }
        next();
    };
};

// Authentication Routes
app.post('/api/register', validateInput(['username', 'email', 'password']), async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username.trim(), email.toLowerCase(), hashedPassword]
        );

        res.status(201).json({ 
            message: 'User registered successfully',
            userId: result.insertId
        });

    } catch (error) {
        handleError(res, error, 'Registration failed');
    }
});

app.post('/api/login', validateInput(['email', 'password']), async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await pool.execute(
            'SELECT id, username, email, password, role, created_at FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        req.session.userId = user.id;
        req.session.role = user.role;

        await pool.execute(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        delete user.password;

        res.json({
            token,
            user: {
                ...user,
                last_login: new Date()
            }
        });

    } catch (error) {
        handleError(res, error, 'Login failed');
    }
});

// Profile Routes (missing previously)
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [req.user.userId]
        );
        if (!users.length) return res.status(404).json({ error: 'User not found' });

        const [stats] = await pool.execute(`
            SELECT 
                COUNT(DISTINCT ur.roadmap_id) as roadmaps_started,
                COUNT(DISTINCT CASE WHEN ur.completed_at IS NOT NULL THEN ur.roadmap_id END) as roadmaps_completed,
                COUNT(DISTINCT up.task_id) as tasks_completed,
                COUNT(DISTINCT c.id) as certificates_earned
            FROM users u
            LEFT JOIN user_roadmaps ur ON u.id = ur.user_id
            LEFT JOIN user_progress up ON u.id = up.user_id AND up.completed = TRUE
            LEFT JOIN certificates c ON u.id = c.user_id
            WHERE u.id = ?
        `, [req.user.userId]);

        res.json({ ...users[0], stats: stats[0] });
    } catch (e) {
        console.error('Profile fetch error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email) return res.status(400).json({ error: 'Username and email are required' });
        const userId = req.user.userId;
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
        if (existing.length) return res.status(400).json({ error: 'Email already taken' });
        if (password && password.trim()) {
            const hashed = await bcrypt.hash(password, 10);
            await pool.execute('UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?', [username, email, hashed, userId]);
        } else {
            await pool.execute('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, userId]);
        }
        res.json({ message: 'Profile updated successfully' });
    } catch (e) {
        console.error('Profile update error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enhanced Profile API Endpoints

// Get user statistics
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get roadmap statistics
        const [roadmapStats] = await pool.execute(`
            SELECT 
                COUNT(DISTINCT up.roadmap_id) as roadmaps_started,
                COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN up.roadmap_id END) as roadmaps_completed
            FROM user_progress up
            WHERE up.user_id = ?
        `, [userId]);
        
        // Get task statistics
        const [taskStats] = await pool.execute(`
            SELECT COUNT(*) as tasks_completed
            FROM user_progress up
            WHERE up.user_id = ? AND up.completed_at IS NOT NULL
        `, [userId]);
        
        // Get badge count - using the badges table instead of user_badges
        const [badgeStats] = await pool.execute(`
            SELECT COUNT(*) as badges_earned
            FROM badges b
            WHERE b.user_id = ?
        `, [userId]);
        
        // Calculate overall progress (mock calculation)
        const overallProgress = Math.min(100, Math.round((taskStats[0].tasks_completed / 10) * 100));
        const weekProgress = Math.floor(Math.random() * 30) + 10; // Mock weekly progress
        
        res.json({
            roadmaps_started: roadmapStats[0].roadmaps_started || 0,
            roadmaps_completed: roadmapStats[0].roadmaps_completed || 0,
            tasks_completed: taskStats[0].tasks_completed || 0,
            badges_earned: badgeStats[0].badges_earned || 0,
            overall_progress: overallProgress,
            week_progress: weekProgress
        });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user learning roadmaps with progress
app.get('/api/user/roadmaps', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const [roadmaps] = await pool.execute(`
            SELECT 
                r.id, r.title, r.description,
                COUNT(DISTINCT t.id) as total_tasks,
                COUNT(DISTINCT CASE WHEN up.completed = 1 THEN t.id END) as completed_tasks,
                ROUND(COUNT(DISTINCT CASE WHEN up.completed = 1 THEN t.id END) * 100.0 / NULLIF(COUNT(DISTINCT t.id), 0), 0) as progress
            FROM roadmaps r
            LEFT JOIN modules m ON r.id = m.roadmap_id
            LEFT JOIN tasks t ON m.id = t.module_id
            LEFT JOIN user_progress up ON t.id = up.task_id AND up.user_id = ?
            WHERE EXISTS (SELECT 1 FROM user_progress up2 
                         JOIN tasks t2 ON up2.task_id = t2.id 
                         JOIN modules m2 ON t2.module_id = m2.id 
                         WHERE m2.roadmap_id = r.id AND up2.user_id = ?)
            GROUP BY r.id, r.title, r.description
            ORDER BY progress DESC
        `, [userId, userId]);
        
        res.json(roadmaps);
    } catch (error) {
        console.error('Error getting user roadmaps:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user achievements and badges
app.get('/api/user/achievements', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Mock achievements for now - could be enhanced with real achievement system
        const achievements = [
            { name: 'First Steps', description: 'Started your first roadmap', icon: 'fa-trophy' },
            { name: 'Task Master', description: 'Completed 10 tasks', icon: 'fa-check' },
            { name: 'Learning Streak', description: '7 days in a row', icon: 'fa-fire' }
        ];
        
        res.json(achievements);
    } catch (error) {
        console.error('Error getting user achievements:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user certificates
app.get('/api/user/certificates', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const [certificates] = await pool.execute(`
            SELECT 
                c.id, 
                c.roadmap_id, 
                COALESCE(r.title, 'Unknown Roadmap') as roadmap_title,
                c.course_id,
                COALESCE(co.title, 'Unknown Course') as course_title,
                c.issued_at,
                c.certificate_url
            FROM certificates c
            LEFT JOIN roadmaps r ON c.roadmap_id = r.id
            LEFT JOIN courses co ON c.course_id = co.id
            WHERE c.user_id = ?
            ORDER BY c.issued_at DESC
        `, [userId]);
        
        res.json(certificates);
    } catch (error) {
        console.error('Error getting user certificates:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user recent activity
app.get('/api/user/activity', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Mock activity data - could be enhanced with real activity tracking
        const activities = [
            { 
                title: 'Completed Module', 
                description: 'JavaScript Basics - Variables and Data Types', 
                icon: 'fa-check-circle',
                created_at: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
            },
            { 
                title: 'Started Roadmap', 
                description: 'Full Stack Development Path', 
                icon: 'fa-play-circle',
                created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
            }
        ];
        
        res.json(activities);
    } catch (error) {
        console.error('Error getting user activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Download certificate
app.get('/api/certificates/:id/download', authenticateToken, async (req, res) => {
    try {
        const certificateId = req.params.id;
        const userId = req.user.userId;
        
        // Verify certificate belongs to user
        const [certificates] = await pool.execute(
            'SELECT * FROM certificates WHERE id = ? AND user_id = ?', 
            [certificateId, userId]
        );
        
        if (!certificates.length) {
            return res.status(404).json({ error: 'Certificate not found' });
        }
        
        // Mock PDF response - in real implementation, generate actual PDF
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="certificate-${certificateId}.pdf"`
        });
        res.send(Buffer.from('Mock PDF content'));
        
    } catch (error) {
        console.error('Error downloading certificate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Download all certificates
app.get('/api/certificates/download-all', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Mock ZIP response - in real implementation, create actual ZIP
        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="my-certificates.zip"'
        });
        res.send(Buffer.from('Mock ZIP content'));
        
    } catch (error) {
        console.error('Error downloading certificates:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin activity log
app.get('/api/admin/activity', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Mock admin activity data
        const activities = [
            {
                action: 'Created Roadmap',
                description: 'Added new "Machine Learning Fundamentals" roadmap',
                admin_name: 'Admin User',
                created_at: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
            },
            {
                action: 'Updated Module',
                description: 'Modified "Introduction to Python" module content',
                admin_name: 'Admin User',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            }
        ];
        console.log('Admin activity log:', activities);
        res.json(activities);
    } catch (error) {
        console.error('Error getting admin activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Roadmap Routes (enhanced with module/task counts)
app.get('/api/roadmaps', async (req, res) => {
    try {
        const [roadmaps] = await pool.execute(`
            SELECT r.*, u.username as creator_name,
                   COUNT(DISTINCT m.id) as module_count,
                   COUNT(DISTINCT t.id) as task_count
            FROM roadmaps r 
            LEFT JOIN users u ON r.created_by = u.id
            LEFT JOIN modules m ON r.id = m.roadmap_id
            LEFT JOIN tasks t ON m.id = t.module_id
            GROUP BY r.id
            ORDER BY r.created_at DESC
        `);
        res.json(roadmaps);
    } catch (error) {
        console.error('❌ Error fetching roadmaps:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/roadmaps/:id', async (req, res) => {
    try {
        const roadmapId = req.params.id;
        const [roadmaps] = await pool.execute('SELECT * FROM roadmaps WHERE id = ?', [roadmapId]);
        if (!roadmaps.length) return res.status(404).json({ error: 'Roadmap not found' });
        const [rows] = await pool.execute(`
            SELECT m.id as module_id, m.title as module_title, m.order_index as module_order,
                   t.id as task_id, t.title as task_title, t.description, t.resource_url, t.order_index as task_order
            FROM modules m
            LEFT JOIN tasks t ON m.id = t.module_id
            WHERE m.roadmap_id = ?
            ORDER BY m.order_index, t.order_index
        `, [roadmapId]);
        const moduleMap = {};
        rows.forEach(r => {
            if (!moduleMap[r.module_id]) {
                moduleMap[r.module_id] = { id: r.module_id, title: r.module_title, order_index: r.module_order, tasks: [] };
            }
            if (r.task_id) moduleMap[r.module_id].tasks.push({ id: r.task_id, title: r.task_title, description: r.description, resource_url: r.resource_url, order_index: r.task_order });
        });
        res.json({ ...roadmaps[0], modules: Object.values(moduleMap) });
    } catch (error) {
        console.error('Error fetching roadmap:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/roadmaps', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, difficulty, duration, modules } = req.body;
        if (!title || !description) return res.status(400).json({ error: 'Title and description are required' });
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const [roadmapResult] = await conn.execute(
                'INSERT INTO roadmaps (title, description, difficulty, duration, created_by) VALUES (?, ?, ?, ?, ?)',
                [title, description, difficulty, duration, req.user.userId]
            );
            const roadmapId = roadmapResult.insertId;
            if (Array.isArray(modules)) {
                for (let i = 0; i < modules.length; i++) {
                    const mod = modules[i];
                    const [modResult] = await conn.execute('INSERT INTO modules (roadmap_id, title, order_index) VALUES (?, ?, ?)', [roadmapId, mod.title, i + 1]);
                    const moduleId = modResult.insertId;
                    if (Array.isArray(mod.tasks)) {
                        for (let j = 0; j < mod.tasks.length; j++) {
                            const task = mod.tasks[j];
                            await conn.execute('INSERT INTO tasks (module_id, title, description, resource_url, order_index) VALUES (?, ?, ?, ?, ?)', [moduleId, task.title, task.description || '', task.resource_url || '', j + 1]);
                        }
                    }
                }
            }
            await conn.commit();
            res.status(201).json({ message: 'Roadmap created successfully', roadmapId });
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Error creating roadmap:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update roadmap
app.put('/api/roadmaps/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, difficulty, duration } = req.body;
        const [result] = await pool.execute('UPDATE roadmaps SET title = ?, description = ?, difficulty = ?, duration = ? WHERE id = ?', [title, description, difficulty, duration, id]);
        if (!result.affectedRows) return res.status(404).json({ error: 'Roadmap not found' });
        res.json({ message: 'Roadmap updated successfully' });
    } catch (e) {
        console.error('Error updating roadmap:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete roadmap
app.delete('/api/roadmaps/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute('DELETE FROM roadmaps WHERE id = ?', [id]);
        if (!result.affectedRows) return res.status(404).json({ error: 'Roadmap not found' });
        res.json({ message: 'Roadmap deleted successfully' });
    } catch (e) {
        console.error('Error deleting roadmap:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ------------------ Module & Task Management (Admin) ------------------
// Create module
app.post('/api/roadmaps/:roadmapId/modules', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const { title } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required' });
        const [[{ nextIndex }]] = await pool.query('SELECT COALESCE(MAX(order_index),0)+1 AS nextIndex FROM modules WHERE roadmap_id = ?', [roadmapId]);
        const [result] = await pool.execute('INSERT INTO modules (roadmap_id, title, order_index) VALUES (?, ?, ?)', [roadmapId, title, nextIndex]);
        res.status(201).json({ id: result.insertId, title, order_index: nextIndex });
    } catch (e) {
        console.error('Error creating module:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update module
app.put('/api/modules/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required' });
        const [result] = await pool.execute('UPDATE modules SET title = ? WHERE id = ?', [title, id]);
        if (!result.affectedRows) return res.status(404).json({ error: 'Module not found' });
        res.json({ message: 'Module updated' });
    } catch (e) {
        console.error('Error updating module:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete module
app.delete('/api/modules/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute('DELETE FROM modules WHERE id = ?', [id]);
        if (!result.affectedRows) return res.status(404).json({ error: 'Module not found' });
        res.json({ message: 'Module deleted' });
    } catch (e) {
        console.error('Error deleting module:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create task
app.post('/api/modules/:moduleId/tasks', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { title, description = '', resource_url = '' } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required' });
        const [[{ nextIndex }]] = await pool.query('SELECT COALESCE(MAX(order_index),0)+1 AS nextIndex FROM tasks WHERE module_id = ?', [moduleId]);
        const [result] = await pool.execute('INSERT INTO tasks (module_id, title, description, resource_url, order_index) VALUES (?,?,?,?,?)', [moduleId, title, description, resource_url, nextIndex]);
        res.status(201).json({ id: result.insertId, title, order_index: nextIndex });
    } catch (e) {
        console.error('Error creating task:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update task
app.put('/api/tasks/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description = '', resource_url = '' } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required' });
        const [result] = await pool.execute('UPDATE tasks SET title = ?, description = ?, resource_url = ? WHERE id = ?', [title, description, resource_url, id]);
        if (!result.affectedRows) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task updated' });
    } catch (e) {
        console.error('Error updating task:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete task
app.delete('/api/tasks/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);
        if (!result.affectedRows) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (e) {
        console.error('Error deleting task:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Progress Routes
app.get('/api/progress/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        if (req.user.userId != userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [progress] = await pool.execute(`
            SELECT 
                ur.roadmap_id,
                r.title as roadmap_title,
                r.duration,
                ur.started_at,
                ur.completed_at,
                COUNT(t.id) as total_tasks,
                COUNT(up.id) as completed_tasks,
                ROUND((COUNT(up.id) / COUNT(t.id)) * 100, 2) as progress_percentage
            FROM user_roadmaps ur
            JOIN roadmaps r ON ur.roadmap_id = r.id
            LEFT JOIN modules m ON r.id = m.roadmap_id
            LEFT JOIN tasks t ON m.id = t.module_id
            LEFT JOIN user_progress up ON t.id = up.task_id AND up.user_id = ? AND up.completed = TRUE
            WHERE ur.user_id = ?
            GROUP BY ur.roadmap_id, r.title, ur.started_at, ur.completed_at
        `, [userId, userId]);

        res.json(progress);
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/progress/task', authenticateToken, async (req, res) => {
    try {
        let { taskId, completed } = req.body;
        const userId = req.user.userId;

        // If 'completed' not provided (legacy frontend), toggle based on existing state.
        if (typeof completed === 'undefined') {
            const [rows] = await pool.execute('SELECT completed FROM user_progress WHERE user_id = ? AND task_id = ?', [userId, taskId]);
            completed = !(rows.length && rows[0].completed === 1);
        }

        if (completed) {
            await pool.execute(
                'INSERT INTO user_progress (user_id, task_id, completed, completed_at) VALUES (?, ?, TRUE, NOW()) ON DUPLICATE KEY UPDATE completed = TRUE, completed_at = NOW()',
                [userId, taskId]
            );
        } else {
            await pool.execute(
                'DELETE FROM user_progress WHERE user_id = ? AND task_id = ?',
                [userId, taskId]
            );
        }
        res.json({ message: 'Progress updated successfully', completed });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Roadmap-specific progress map
app.get('/api/roadmaps/:id/progress', authenticateToken, async (req, res) => {
    try {
        const roadmapId = req.params.id;
        const userId = req.user.userId;
        const [rows] = await pool.execute(`
            SELECT t.id as task_id, up.completed
            FROM roadmaps r
            JOIN modules m ON r.id = m.roadmap_id
            JOIN tasks t ON m.id = t.module_id
            LEFT JOIN user_progress up ON t.id = up.task_id AND up.user_id = ?
            WHERE r.id = ?
        `, [userId, roadmapId]);
        const map = {};
        rows.forEach(r => { map[r.task_id] = r.completed === 1; });
        res.json(map);
    } catch (e) {
        console.error('Error fetching roadmap progress:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/roadmaps/:id/start', authenticateToken, async (req, res) => {
    try {
        const roadmapId = req.params.id;
        const userId = req.user.userId;

        const [existing] = await pool.execute(
            'SELECT id FROM user_roadmaps WHERE user_id = ? AND roadmap_id = ?',
            [userId, roadmapId]
        );

        if (existing.length === 0) {
            await pool.execute(
                'INSERT INTO user_roadmaps (user_id, roadmap_id) VALUES (?, ?)',
                [userId, roadmapId]
            );
        }

        res.json({ message: 'Roadmap started successfully' });
    } catch (error) {
        console.error('Error starting roadmap:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Course Routes
// Health endpoint
app.get('/api/health', async (req, res) => {
    try {
        await pool.execute('SELECT 1');
        res.json({ status: 'ok', time: new Date().toISOString() });
    } catch (e) {
        res.status(500).json({ status: 'error' });
    }
});

// User Routes
app.get('/api/user/activity', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const [activities] = await pool.execute(`
            (SELECT 'task_completed' as type,
                    CONCAT('Completed task: ', t.title, ' (', r.title, ')') as description,
                    up.completed_at as created_at
             FROM user_progress up
             JOIN tasks t ON up.task_id = t.id
             JOIN modules m ON t.module_id = m.id
             JOIN roadmaps r ON m.roadmap_id = r.id
             WHERE up.user_id = ? AND up.completed = 1)
            UNION ALL
            (SELECT 'roadmap_started' as type,
                    CONCAT('Started roadmap: ', r.title) as description,
                    ur.started_at as created_at
             FROM user_roadmaps ur
             JOIN roadmaps r ON ur.roadmap_id = r.id
             WHERE ur.user_id = ?)
            ORDER BY created_at DESC
            LIMIT 15
        `, [userId, userId]);
        res.json(activities);
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/user/active-roadmaps', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const [rows] = await pool.execute(`
            SELECT r.id, r.title, r.description, r.difficulty, r.duration,
                   ur.started_at,
                   COUNT(t.id) as total_tasks,
                   SUM(CASE WHEN up.completed = 1 THEN 1 ELSE 0 END) as done
            FROM user_roadmaps ur
            JOIN roadmaps r ON ur.roadmap_id = r.id
            LEFT JOIN modules m ON r.id = m.roadmap_id
            LEFT JOIN tasks t ON m.id = t.module_id
            LEFT JOIN user_progress up ON up.task_id = t.id AND up.user_id = ur.user_id
            WHERE ur.user_id = ?
            GROUP BY r.id, ur.started_at
            HAVING total_tasks = 0 OR done < total_tasks
            ORDER BY ur.started_at DESC
        `, [userId]);
        const formatted = rows.map(r => ({ ...r, progress: r.total_tasks ? Math.round((r.done / r.total_tasks) * 100) : 0 }));
        res.json(formatted);
    } catch (error) {
        console.error('Error fetching active roadmaps:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/badges/request', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { roadmapId } = req.body;
        // compute completion
        const [rows] = await pool.execute(`
            SELECT COUNT(t.id) total_tasks,
                   SUM(CASE WHEN up.completed = 1 THEN 1 ELSE 0 END) done
            FROM roadmaps r
            LEFT JOIN modules m ON r.id = m.roadmap_id
            LEFT JOIN tasks t ON m.id = t.module_id
            LEFT JOIN user_progress up ON up.task_id = t.id AND up.user_id = ?
            WHERE r.id = ?
            GROUP BY r.id`, [userId, roadmapId]);
        if(!rows.length || rows[0].total_tasks === 0 || rows[0].done < rows[0].total_tasks){
            return res.status(400).json({ error: 'Complete all tasks before requesting a badge' });
        }
        // create badge immediately (simplified)
        const badgeUrl = `/badges/${userId}_${roadmapId}_${Date.now()}.png`;
        await pool.execute('INSERT INTO badges (user_id, roadmap_id, badge_url) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE badge_url = VALUES(badge_url), issued_at = NOW()', [userId, roadmapId, badgeUrl]);
        res.json({ message: 'Badge issued successfully', badgeUrl });
    } catch (error) {
        console.error('Error issuing badge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Badge Request Routes
// Admin module management endpoints
app.post('/api/admin/roadmaps/:roadmapId/modules', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const { title, order_index } = req.body;
        if (!title) return res.status(400).json({ error: 'Module title is required' });
        
        const [result] = await pool.execute(
            'INSERT INTO modules (roadmap_id, title, order_index) VALUES (?, ?, ?)',
            [roadmapId, title, order_index || 1]
        );
        
        res.status(201).json({ message: 'Module created successfully', moduleId: result.insertId });
    } catch (error) {
        console.error('Error creating module:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/admin/modules/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, order_index } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE modules SET title = ?, order_index = ? WHERE id = ?',
            [title, order_index, id]
        );
        
        if (!result.affectedRows) return res.status(404).json({ error: 'Module not found' });
        res.json({ message: 'Module updated successfully' });
    } catch (error) {
        console.error('Error updating module:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/admin/modules/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute('DELETE FROM modules WHERE id = ?', [id]);
        if (!result.affectedRows) return res.status(404).json({ error: 'Module not found' });
        res.json({ message: 'Module deleted successfully' });
    } catch (error) {
        console.error('Error deleting module:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin task management endpoints
app.post('/api/admin/modules/:moduleId/tasks', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { title, description, resource_url, order_index } = req.body;
        if (!title) return res.status(400).json({ error: 'Task title is required' });
        
        const [result] = await pool.execute(
            'INSERT INTO tasks (module_id, title, description, resource_url, order_index) VALUES (?, ?, ?, ?, ?)',
            [moduleId, title, description || '', resource_url || '', order_index || 1]
        );
        
        res.status(201).json({ message: 'Task created successfully', taskId: result.insertId });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/admin/tasks/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, resource_url, order_index } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE tasks SET title = ?, description = ?, resource_url = ?, order_index = ? WHERE id = ?',
            [title, description, resource_url, order_index, id]
        );
        
        if (!result.affectedRows) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/admin/tasks/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);
        if (!result.affectedRows) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin dashboard stats
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM roadmaps) as total_roadmaps,
                (SELECT COUNT(*) FROM courses) as total_courses,
                (SELECT COUNT(*) FROM tasks) as total_tasks,
                (SELECT COUNT(*) FROM user_progress WHERE completed = 1) as completed_tasks,
                (SELECT COUNT(*) FROM certificates) as certificates_issued,
                (SELECT COUNT(*) FROM badges) as badges_issued
        `);
        
        res.json(stats[0]);
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===== COURSES API ENDPOINTS =====

// Get all courses
app.get('/api/courses', optionalAuthentication, async (req, res) => {
    try {
        console.log('Courses endpoint called, user:', req.user?.userId || 'anonymous');
        const userId = req.user?.userId || null;
        
        // First get basic course info
        const [courses] = await pool.execute(`
            SELECT c.*, 
                   COUNT(DISTINCT cl.id) as lessons_count,
                   COUNT(DISTINCT uc.user_id) as students_count
            FROM courses c
            LEFT JOIN course_lessons cl ON c.id = cl.course_id
            LEFT JOIN user_courses uc ON c.id = uc.course_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);

        console.log('Found courses:', courses.length);
        
        // Then get user-specific progress if user is logged in
        let userProgress = {};
        if (userId) {
            try {
                const [progressData] = await pool.execute(`
                    SELECT course_id, progress, completed_at 
                    FROM user_courses 
                    WHERE user_id = ?
                `, [userId]);
                userProgress = progressData.reduce((acc, item) => {
                    acc[item.course_id] = {
                        progress: item.progress || 0,
                        completed_at: item.completed_at
                    };
                    return acc;
                }, {});
            } catch (progressError) {
                console.log('Progress column not found, using default progress');
                // If progress column doesn't exist, use completed_at to determine progress
                const [progressData] = await pool.execute(`
                    SELECT course_id, completed_at 
                    FROM user_courses 
                    WHERE user_id = ?
                `, [userId]);
                userProgress = progressData.reduce((acc, item) => {
                    acc[item.course_id] = {
                        progress: item.completed_at ? 100 : 0,
                        completed_at: item.completed_at
                    };
                    return acc;
                }, {});
            }
        }

        const enriched = courses.map(c => {
            const userCourseData = userProgress[c.id] || {};
            return {
                id: c.id,
                title: c.title,
                description: c.description,
                difficulty: c.difficulty,
                duration: c.duration,
                lessons_count: c.lessons_count,
                students_count: c.students_count,
                progress: userCourseData.progress || 0,
                completed: !!userCourseData.completed_at
            };
        });
        res.json(enriched);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get course by ID
app.get('/api/courses/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user?.userId || null;
        const [courses] = await pool.execute('SELECT * FROM courses WHERE id = ?', [courseId]);
        if (!courses.length) return res.status(404).json({ error: 'Course not found' });
        const course = courses[0];

        const [lessons] = await pool.execute(`
            SELECT l.*, lp.completed as user_completed
            FROM course_lessons l
            LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id ${userId ? 'AND lp.user_id = ?' : 'AND 1=0'}
            WHERE l.course_id = ?
            ORDER BY l.order_index, l.id
        `, userId ? [userId, courseId] : [courseId]);

        let completedCount = 0;
        lessons.forEach(l => { if (l.user_completed) completedCount++; });
        const progress = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

        // If user enrolled, update user_courses progress
        if (userId) {
            await pool.execute(`INSERT INTO user_courses (user_id, course_id, progress) VALUES (?, ?, ?)
                                ON DUPLICATE KEY UPDATE progress = VALUES(progress), completed_at = CASE WHEN VALUES(progress)=100 THEN NOW() ELSE completed_at END`,
                [userId, courseId, progress]);
        }

        course.lessons = lessons.map(l => ({
            id: l.id,
            title: l.title,
            duration: l.duration,
            resource_url: l.resource_url,
            completed: !!l.user_completed
        }));
        course.progress = progress;

        // Check existing certificate request
        if (userId) {
            const [reqs] = await pool.execute('SELECT status FROM certificate_requests WHERE user_id=? AND course_id=? ORDER BY id DESC LIMIT 1', [userId, courseId]);
            if (reqs.length) course.certificate_requested = reqs[0].status === 'pending' || reqs[0].status === 'approved';
        }

        res.json(course);
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create course (admin)
app.post('/api/courses', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, difficulty, duration } = req.body;
        const userId = req.user.userId;
        await pool.execute('INSERT INTO courses (title, description, difficulty, duration, created_by) VALUES (?,?,?,?,?)',
            [title, description, difficulty, duration, userId]);
        res.json({ message: 'Course created' });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error'}); }
});

// Update course
app.put('/api/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, difficulty, duration } = req.body;
        await pool.execute('UPDATE courses SET title=?, description=?, difficulty=?, duration=? WHERE id=?',
            [title, description, difficulty, duration, req.params.id]);
        res.json({ message: 'Course updated' });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error'}); }
});

// Delete course
app.delete('/api/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
    try { await pool.execute('DELETE FROM courses WHERE id=?', [req.params.id]); res.json({ message: 'Course deleted'}); }
    catch(e){ console.error(e); res.status(500).json({ error: 'Internal server error'}); }
});

// Add lesson
app.post('/api/courses/:id/lessons', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, duration, resource_url, order_index } = req.body;
        await pool.execute('INSERT INTO course_lessons (course_id, title, duration, resource_url, order_index) VALUES (?,?,?,?,?)',
            [req.params.id, title, duration, resource_url, order_index || 1]);
        res.json({ message: 'Lesson added'});
    } catch(e){ console.error(e); res.status(500).json({ error: 'Internal server error'}); }
});

// Update lesson
app.put('/api/lessons/:lessonId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, duration, resource_url, order_index } = req.body;
        await pool.execute('UPDATE course_lessons SET title=?, duration=?, resource_url=?, order_index=? WHERE id=?',
            [title, duration, resource_url, order_index, req.params.lessonId]);
        res.json({ message: 'Lesson updated'});
    } catch(e){ console.error(e); res.status(500).json({ error: 'Internal server error'}); }
});

// Delete lesson
app.delete('/api/lessons/:lessonId', authenticateToken, requireAdmin, async (req, res) => {
    try { await pool.execute('DELETE FROM course_lessons WHERE id=?', [req.params.lessonId]); res.json({ message: 'Lesson deleted'}); }
    catch(e){ console.error(e); res.status(500).json({ error: 'Internal server error'}); }
});

// Start course (enroll)
app.post('/api/courses/:id/start', authenticateToken, async (req, res) => {
    try { await pool.execute('INSERT IGNORE INTO user_courses (user_id, course_id) VALUES (?, ?)', [req.user.userId, req.params.id]); res.json({ message:'Course started'}); }
    catch(e){ console.error(e); res.status(500).json({ error: 'Internal server error'}); }
});

// Lesson progress toggle
app.post('/api/lessons/:lessonId/progress', authenticateToken, async (req, res) => {
    try {
        const { completed } = req.body;
        const userId = req.user.userId;
        const lessonId = req.params.lessonId;
        
        // Check if lesson exists
        const [[lessonCheck]] = await pool.query('SELECT id FROM course_lessons WHERE id=?', [lessonId]);
        if (!lessonCheck) {
            return res.status(404).json({ error: 'Lesson not found' });
        }
        
        // Upsert lesson progress
        await pool.execute(`INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at)
                            VALUES (?, ?, ?, CASE WHEN ?=1 THEN NOW() ELSE NULL END)
                            ON DUPLICATE KEY UPDATE completed=VALUES(completed), completed_at=CASE WHEN VALUES(completed)=1 THEN NOW() ELSE NULL END`,
            [userId, lessonId, completed?1:0, completed?1:0]);
        // Recompute course progress
        const [[lessonRow]] = await pool.query('SELECT course_id FROM course_lessons WHERE id=?', [lessonId]);
        if (lessonRow) {
            const courseId = lessonRow.course_id;
            const [[counts]] = await pool.query(`SELECT 
                (SELECT COUNT(*) FROM course_lessons WHERE course_id=?) total,
                (SELECT COUNT(*) FROM lesson_progress lp JOIN course_lessons cl ON lp.lesson_id=cl.id WHERE cl.course_id=? AND lp.user_id=? AND lp.completed=1) done
            `, [courseId, courseId, userId]);
            const progress = counts.total ? Math.round((counts.done / counts.total)*100) : 0;
            await pool.execute(`INSERT INTO user_courses (user_id, course_id, progress, completed_at) VALUES (?,?,?,CASE WHEN ?=100 THEN NOW() ELSE NULL END)
                                ON DUPLICATE KEY UPDATE progress=VALUES(progress), completed_at=CASE WHEN VALUES(progress)=100 THEN NOW() ELSE completed_at END`,
                [userId, courseId, progress, progress]);
            return res.json({ message:'Progress updated', progress });
        }
        res.json({ message:'Progress updated'});
    } catch(e){ console.error(e); res.status(500).json({ error:'Internal server error'}); }
});

// Save course notes
app.post('/api/courses/notes', authenticateToken, async (req, res) => {
    try {
        const { courseId, notes } = req.body;
        const userId = req.user.userId;
        
        await pool.execute(
            'INSERT INTO course_notes (user_id, course_id, notes, created_at) VALUES (?, ?, ?, NOW())',
            [userId, courseId, notes]
        );
        
        res.json({ message: 'Notes saved successfully' });
    } catch (error) {
        console.error('Error saving course notes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===== CERTIFICATE REQUEST ENDPOINTS =====

// Request certificate
app.post('/api/certificates/request', authenticateToken, async (req, res) => {
    try {
        const { courseId, roadmapId, type } = req.body;
        const userId = req.user.userId;
        
        // Get user details
        const [users] = await pool.execute('SELECT username FROM users WHERE id = ?', [userId]);
        if (!users.length) return res.status(404).json({ error: 'User not found' });
        
        let title = '';
        if (type === 'course' && courseId) {
            const [courses] = await pool.execute('SELECT title FROM courses WHERE id = ?', [courseId]);
            title = courses[0]?.title || 'Unknown Course';
        } else if (type === 'roadmap' && roadmapId) {
            const [roadmaps] = await pool.execute('SELECT title FROM roadmaps WHERE id = ?', [roadmapId]);
            title = roadmaps[0]?.title || 'Unknown Roadmap';
        }
        
        // Prevent duplicate pending request
        const [existing] = await pool.execute('SELECT id FROM certificate_requests WHERE user_id=? AND (course_id=? OR roadmap_id=?) AND status="pending" LIMIT 1', [userId, courseId||0, roadmapId||0]);
        if (existing.length) return res.status(400).json({ error:'Request already pending' });
        await pool.execute(`INSERT INTO certificate_requests (user_id, course_id, roadmap_id, student_name, certificate_title, status) VALUES (?,?,?,?,?, 'pending')`,
            [userId, courseId || null, roadmapId || null, users[0].username, title]);
        
        res.json({ message: 'Certificate request submitted successfully' });
    } catch (error) {
        console.error('Error requesting certificate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===== BADGE REQUEST ENDPOINTS =====

// Request badge
app.post('/api/badges/request', authenticateToken, async (req, res) => {
    try {
        const { roadmapId, type } = req.body;
        const userId = req.user.userId;
        
        // Get user and roadmap details
        const [users] = await pool.execute('SELECT username FROM users WHERE id = ?', [userId]);
        const [roadmaps] = await pool.execute('SELECT title FROM roadmaps WHERE id = ?', [roadmapId]);
        
        if (!users.length || !roadmaps.length) {
            return res.status(404).json({ error: 'User or roadmap not found' });
        }
        
        const [existing] = await pool.execute('SELECT id FROM badge_requests WHERE user_id=? AND roadmap_id=? AND status="pending" LIMIT 1', [userId, roadmapId]);
        if (existing.length) return res.status(400).json({ error:'Request already pending' });
        await pool.execute(`INSERT INTO badge_requests (user_id, roadmap_id, student_name, roadmap_title, status) VALUES (?,?,?,?, 'pending')`,
            [userId, roadmapId, users[0].username, roadmaps[0].title]);
        
        res.json({ message: 'Badge request submitted successfully' });
    } catch (error) {
        console.error('Error requesting badge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Approve certificate request
app.post('/api/admin/certificate-requests/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const requestId = req.params.id;
        const [rows] = await pool.execute('SELECT * FROM certificate_requests WHERE id=?', [requestId]);
        if (!rows.length) return res.status(404).json({ error:'Not found'});
        const r = rows[0];
        await pool.execute('UPDATE certificate_requests SET status="approved", reviewed_at=NOW(), reviewed_by=? WHERE id=?', [req.user.userId, requestId]);
        // Create certificate record
        await pool.execute('INSERT INTO certificates (user_id, roadmap_id, course_id, certificate_url, issued_at) VALUES (?,?,?,?, NOW())',
            [r.user_id, r.roadmap_id || null, r.course_id || null, `/certificates/${requestId}.pdf`]);
        res.json({ message:'Certificate approved' });
    } catch(e){ console.error(e); res.status(500).json({ error:'Internal server error'}); }
});

// Approve badge request
app.post('/api/admin/badge-requests/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const requestId = req.params.id;
        const [rows] = await pool.execute('SELECT * FROM badge_requests WHERE id=?', [requestId]);
        if (!rows.length) return res.status(404).json({ error:'Not found'});
        const r = rows[0];
        await pool.execute('UPDATE badge_requests SET status="approved", reviewed_at=NOW(), reviewed_by=? WHERE id=?', [req.user.userId, requestId]);
        await pool.execute('INSERT INTO badges (user_id, roadmap_id, badge_url, issued_at) VALUES (?,?,?, NOW())',
            [r.user_id, r.roadmap_id, `/badges/${requestId}.png`]);
        res.json({ message:'Badge approved' });
    } catch(e){ console.error(e); res.status(500).json({ error:'Internal server error'}); }
});

// Unified requests summary
app.get('/api/admin/requests/summary', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [certs] = await pool.execute('SELECT * FROM certificate_requests WHERE status="pending" ORDER BY requested_at DESC LIMIT 20');
        const [badges] = await pool.execute('SELECT * FROM badge_requests WHERE status="pending" ORDER BY requested_at DESC LIMIT 20');
        res.json({ certificates: certs, badges });
    } catch(e){ console.error(e); res.status(500).json({ error:'Internal server error'}); }
});

// ===== ADMIN CERTIFICATE/BADGE MANAGEMENT =====

// Get certificate requests
app.get('/api/admin/certificate-requests', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [requests] = await pool.execute(`
            SELECT cr.*, u.username as student_name
            FROM certificate_requests cr
            JOIN users u ON cr.user_id = u.id
            WHERE cr.status = 'pending'
            ORDER BY cr.requested_at DESC
        `);
        
        res.json(requests);
    } catch (error) {
        console.error('Error fetching certificate requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get badge requests
app.get('/api/admin/badge-requests', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [requests] = await pool.execute(`
            SELECT br.*, u.username as student_name
            FROM badge_requests br
            JOIN users u ON br.user_id = u.id
            WHERE br.status = 'pending'
            ORDER BY br.requested_at DESC
        `);
        
        res.json(requests);
    } catch (error) {
        console.error('Error fetching badge requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single certificate request
app.get('/api/admin/certificate-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const requestId = req.params.id;
        const [requests] = await pool.execute(`
            SELECT cr.*, u.username as student_name,
                   c.title as course_title, r.title as roadmap_title
            FROM certificate_requests cr
            JOIN users u ON cr.user_id = u.id
            LEFT JOIN courses c ON cr.course_id = c.id
            LEFT JOIN roadmaps r ON cr.roadmap_id = r.id
            WHERE cr.id = ?
        `, [requestId]);
        
        if (!requests.length) return res.status(404).json({ error: 'Request not found' });
        
        res.json(requests[0]);
    } catch (error) {
        console.error('Error fetching certificate request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single badge request
app.get('/api/admin/badge-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const requestId = req.params.id;
        const [requests] = await pool.execute(`
            SELECT br.*, u.username as student_name, r.title as roadmap_title
            FROM badge_requests br
            JOIN users u ON br.user_id = u.id
            JOIN roadmaps r ON br.roadmap_id = r.id
            WHERE br.id = ?
        `, [requestId]);
        
        if (!requests.length) return res.status(404).json({ error: 'Request not found' });
        
        res.json(requests[0]);
    } catch (error) {
        console.error('Error fetching badge request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate certificate
app.post('/api/admin/generate-certificate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { requestId, studentName, courseTitle, completionDate, instructorName, certificateId } = req.body;
        
        // Update request status and create certificate
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            
            // Get request details
            const [requests] = await conn.execute('SELECT * FROM certificate_requests WHERE id = ?', [requestId]);
            if (!requests.length) throw new Error('Request not found');
            
            const request = requests[0];
            
            // Create certificate record
            await conn.execute(`
                INSERT INTO certificates (user_id, course_id, roadmap_id, certificate_id, student_name, title, instructor_name, completion_date, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [request.user_id, request.course_id, request.roadmap_id, certificateId, studentName, courseTitle, instructorName, completionDate]);
            
            // Update request status
            await conn.execute('UPDATE certificate_requests SET status = ?, processed_at = NOW() WHERE id = ?', ['approved', requestId]);
            
            await conn.commit();
            res.json({ message: 'Certificate generated successfully' });
            
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Error generating certificate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate badge
app.post('/api/admin/generate-badge', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { requestId, studentName, roadmapTitle, completionDate, badgeId, badgeType } = req.body;
        
        // Update request status and create badge
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            
            // Get request details
            const [requests] = await conn.execute('SELECT * FROM badge_requests WHERE id = ?', [requestId]);
            if (!requests.length) throw new Error('Request not found');
            
            const request = requests[0];
            
            // Create badge record
            await conn.execute(`
                INSERT INTO user_badges (user_id, roadmap_id, badge_id, student_name, roadmap_title, badge_type, completion_date, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `, [request.user_id, request.roadmap_id, badgeId, studentName, roadmapTitle, badgeType, completionDate]);
            
            // Update request status
            await conn.execute('UPDATE badge_requests SET status = ?, processed_at = NOW() WHERE id = ?', ['approved', requestId]);
            
            await conn.commit();
            res.json({ message: 'Badge generated successfully' });
            
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Error generating badge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reject certificate request
app.post('/api/admin/reject-certificate-request', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { requestId } = req.body;
        
        await pool.execute('UPDATE certificate_requests SET status = ?, processed_at = NOW() WHERE id = ?', ['rejected', requestId]);
        
        res.json({ message: 'Certificate request rejected' });
    } catch (error) {
        console.error('Error rejecting certificate request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reject badge request
app.post('/api/admin/reject-badge-request', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { requestId } = req.body;
        
        await pool.execute('UPDATE badge_requests SET status = ?, processed_at = NOW() WHERE id = ?', ['rejected', requestId]);
        
        res.json({ message: 'Badge request rejected' });
    } catch (error) {
        console.error('Error rejecting badge request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 Enhanced LearnPath Server running on port ${PORT}`);
        console.log(`📱 Frontend: http://localhost:${PORT}`);
        console.log(`🔗 API: http://localhost:${PORT}/api`);
        console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    });
}

module.exports = app;