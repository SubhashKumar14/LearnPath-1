const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const { pool, testConnection } = require('./db');
const { authenticateToken, requireAdmin, JWT_SECRET } = require('./auth_middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Test database connection
testConnection();

// Authentication Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({ 
            message: 'User created successfully',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const [users] = await pool.execute(
            'SELECT id, username, email, password, role, created_at FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
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
app.get('/api/courses', async (req, res) => {
    try {
        console.log('📍 GET /api/courses endpoint hit');
        const [courses] = await pool.execute(`
            SELECT c.*, u.username as creator_name,
                   COUNT(DISTINCT cm.id) as module_count,
                   COUNT(DISTINCT l.id) as lesson_count
            FROM courses c 
            LEFT JOIN users u ON c.created_by = u.id
            LEFT JOIN course_modules cm ON c.id = cm.course_id
            LEFT JOIN lessons l ON cm.id = l.module_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);

        console.log(`📊 Found ${courses.length} courses`);
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/courses/:id', async (req, res) => {
    try {
        const courseId = req.params.id;

        const [courses] = await pool.execute(
            'SELECT * FROM courses WHERE id = ?',
            [courseId]
        );

        if (courses.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const [modules] = await pool.execute(`
            SELECT cm.*, 
                   JSON_ARRAYAGG(
                       JSON_OBJECT(
                           'id', l.id,
                           'title', l.title,
                           'description', l.description,
                           'resource_url', l.resource_url,
                           'order_index', l.order_index
                       )
                   ) as lessons
            FROM course_modules cm
            LEFT JOIN lessons l ON cm.id = l.module_id
            WHERE cm.course_id = ?
            GROUP BY cm.id
            ORDER BY cm.order_index
        `, [courseId]);

        const course = {
            ...courses[0],
            modules: modules
        };

        res.json(course);
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Routes
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user statistics
        const [roadmapStats] = await pool.execute(`
            SELECT 
                COUNT(DISTINCT up.roadmap_id) as roadmapsStarted,
                COUNT(DISTINCT CASE WHEN up.completion_percentage = 100 THEN up.roadmap_id END) as roadmapsCompleted
            FROM user_progress up 
            WHERE up.user_id = ?
        `, [userId]);

        const [taskStats] = await pool.execute(`
            SELECT COUNT(*) as tasksCompleted
            FROM task_progress tp
            WHERE tp.user_id = ? AND tp.completed = 1
        `, [userId]);

        const [badgeStats] = await pool.execute(`
            SELECT COUNT(*) as badgesEarned
            FROM badge_requests br
            WHERE br.user_id = ? AND br.status = 'approved'
        `, [userId]);

        res.json({
            roadmapsStarted: roadmapStats[0].roadmapsStarted || 0,
            roadmapsCompleted: roadmapStats[0].roadmapsCompleted || 0,
            tasksCompleted: taskStats[0].tasksCompleted || 0,
            badgesEarned: badgeStats[0].badgesEarned || 0
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/user/activity', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get recent activity (task completions, roadmap starts, etc.)
        const [activities] = await pool.execute(`
            SELECT 
                'task_completed' as type,
                CONCAT('Completed task in ', r.title) as description,
                tp.updated_at as created_at
            FROM task_progress tp
            JOIN tasks t ON tp.task_id = t.id
            JOIN modules m ON t.module_id = m.id
            JOIN roadmaps r ON m.roadmap_id = r.id
            WHERE tp.user_id = ? AND tp.completed = 1
            
            UNION ALL
            
            SELECT 
                'roadmap_started' as type,
                CONCAT('Started roadmap: ', r.title) as description,
                up.created_at
            FROM user_progress up
            JOIN roadmaps r ON up.roadmap_id = r.id
            WHERE up.user_id = ?
            
            ORDER BY created_at DESC
            LIMIT 10
        `, [userId, userId]);

        res.json(activities);
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/user/active-roadmaps', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get active roadmaps (started but not completed)
        const [roadmaps] = await pool.execute(`
            SELECT 
                r.*,
                up.completion_percentage as progress,
                up.created_at as started_at
            FROM roadmaps r
            JOIN user_progress up ON r.id = up.roadmap_id
            WHERE up.user_id = ? AND up.completion_percentage < 100
            ORDER BY up.updated_at DESC
        `, [userId]);

        res.json(roadmaps);
    } catch (error) {
        console.error('Error fetching active roadmaps:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/badges/request', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { roadmapId } = req.body;

        // Check if roadmap is completed
        const [progress] = await pool.execute(
            'SELECT completion_percentage FROM user_progress WHERE user_id = ? AND roadmap_id = ?',
            [userId, roadmapId]
        );

        if (!progress.length || progress[0].completion_percentage < 100) {
            return res.status(400).json({ error: 'Roadmap must be completed to request a badge' });
        }

        // Check if badge already requested
        const [existing] = await pool.execute(
            'SELECT id FROM badge_requests WHERE user_id = ? AND roadmap_id = ?',
            [userId, roadmapId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Badge already requested for this roadmap' });
        }

        // Create badge request
        await pool.execute(
            'INSERT INTO badge_requests (user_id, roadmap_id, status) VALUES (?, ?, ?)',
            [userId, roadmapId, 'pending']
        );

        res.json({ message: 'Badge request submitted successfully' });
    } catch (error) {
        console.error('Error requesting badge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/certificates/request', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { roadmapId } = req.body;

        // Check if roadmap is completed
        const [progress] = await pool.execute(
            'SELECT completion_percentage FROM user_progress WHERE user_id = ? AND roadmap_id = ?',
            [userId, roadmapId]
        );

        if (!progress.length || progress[0].completion_percentage < 100) {
            return res.status(400).json({ error: 'Roadmap must be completed to request a certificate' });
        }

        // Check if certificate already requested
        const [existing] = await pool.execute(
            'SELECT id FROM certificate_requests WHERE user_id = ? AND roadmap_id = ?',
            [userId, roadmapId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Certificate already requested for this roadmap' });
        }

        // Create certificate request
        await pool.execute(
            'INSERT INTO certificate_requests (user_id, roadmap_id, status) VALUES (?, ?, ?)',
            [userId, roadmapId, 'pending']
        );

        res.json({ message: 'Certificate request submitted successfully' });
    } catch (error) {
        console.error('Error requesting certificate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Badge Request Routes
app.post('/api/badge-requests', authenticateToken, async (req, res) => {
    try {
        const { roadmapId, recipientName, roadmapName } = req.body;
        const userId = req.user.userId;

        // Check if user has completed the roadmap
        const [progress] = await pool.execute(`
            SELECT 
                COUNT(t.id) as total_tasks,
                COUNT(up.id) as completed_tasks
            FROM roadmaps r
            LEFT JOIN modules m ON r.id = m.roadmap_id
            LEFT JOIN tasks t ON m.id = t.module_id
            LEFT JOIN user_progress up ON t.id = up.task_id AND up.user_id = ? AND up.completed = TRUE
            WHERE r.id = ?
            GROUP BY r.id
        `, [userId, roadmapId]);

        if (progress.length === 0 || progress[0].total_tasks === 0) {
            return res.status(400).json({ error: 'Roadmap not found or has no tasks' });
        }

        if (progress[0].completed_tasks < progress[0].total_tasks) {
            return res.status(400).json({ error: 'Roadmap not completed yet' });
        }

        // Check if already requested
        const [existing] = await pool.execute(
            'SELECT id FROM badge_requests WHERE user_id = ? AND roadmap_id = ?',
            [userId, roadmapId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Badge already requested for this roadmap' });
        }

        await pool.execute(
            'INSERT INTO badge_requests (user_id, roadmap_id, recipient_name, roadmap_name, completion_date) VALUES (?, ?, ?, ?, CURDATE())',
            [userId, roadmapId, recipientName, roadmapName]
        );

        res.json({ message: 'Badge request submitted successfully' });
    } catch (error) {
        console.error('Error creating badge request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Certificate Request Routes  
app.post('/api/certificate-requests', authenticateToken, async (req, res) => {
    try {
        const { courseId, recipientName, courseName } = req.body;
        const userId = req.user.userId;

        // Check if user has completed the course
        const [progress] = await pool.execute(`
            SELECT 
                COUNT(l.id) as total_lessons,
                COUNT(lp.id) as completed_lessons
            FROM courses c
            LEFT JOIN course_modules cm ON c.id = cm.course_id
            LEFT JOIN lessons l ON cm.id = l.module_id
            LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = ? AND lp.completed = TRUE
            WHERE c.id = ?
            GROUP BY c.id
        `, [userId, courseId]);

        if (progress.length === 0 || progress[0].total_lessons === 0) {
            return res.status(400).json({ error: 'Course not found or has no lessons' });
        }

        if (progress[0].completed_lessons < progress[0].total_lessons) {
            return res.status(400).json({ error: 'Course not completed yet' });
        }

        // Check if already requested
        const [existing] = await pool.execute(
            'SELECT id FROM certificate_requests WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Certificate already requested for this course' });
        }

        await pool.execute(
            'INSERT INTO certificate_requests (user_id, course_id, recipient_name, course_name, completion_date) VALUES (?, ?, ?, ?, CURDATE())',
            [userId, courseId, recipientName, courseName]
        );

        res.json({ message: 'Certificate request submitted successfully' });
    } catch (error) {
        console.error('Error creating certificate request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin Routes
app.get('/api/admin/badge-requests', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [requests] = await pool.execute(`
            SELECT br.*, u.username, u.email, r.title as roadmap_title
            FROM badge_requests br
            JOIN users u ON br.user_id = u.id
            JOIN roadmaps r ON br.roadmap_id = r.id
            ORDER BY br.requested_at DESC
        `);

        res.json(requests);
    } catch (error) {
        console.error('Error fetching badge requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin/certificate-requests', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [requests] = await pool.execute(`
            SELECT cr.*, u.username, u.email, c.title as course_title
            FROM certificate_requests cr
            JOIN users u ON cr.user_id = u.id
            JOIN courses c ON cr.course_id = c.id
            ORDER BY cr.requested_at DESC
        `);

        res.json(requests);
    } catch (error) {
        console.error('Error fetching certificate requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/badge-requests/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const requestId = req.params.id;
        const { recipientName, roadmapName, completionDate } = req.body;
        const adminId = req.user.userId;

        await pool.execute(
            'UPDATE badge_requests SET status = "approved", approved_at = NOW(), approved_by = ?, recipient_name = ?, roadmap_name = ?, completion_date = ? WHERE id = ?',
            [adminId, recipientName, roadmapName, completionDate, requestId]
        );

        // Create badge record
        const [request] = await pool.execute(
            'SELECT user_id, roadmap_id FROM badge_requests WHERE id = ?',
            [requestId]
        );

        if (request.length > 0) {
            await pool.execute(
                'INSERT INTO badges (user_id, roadmap_id, badge_url) VALUES (?, ?, ?)',
                [request[0].user_id, request[0].roadmap_id, `/badges/${requestId}.html`]
            );
        }

        res.json({ message: 'Badge request approved successfully' });
    } catch (error) {
        console.error('Error approving badge request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/certificate-requests/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const requestId = req.params.id;
        const { recipientName, courseName, completionDate } = req.body;
        const adminId = req.user.userId;

        await pool.execute(
            'UPDATE certificate_requests SET status = "approved", approved_at = NOW(), approved_by = ?, recipient_name = ?, course_name = ?, completion_date = ? WHERE id = ?',
            [adminId, recipientName, courseName, completionDate, requestId]
        );

        // Create certificate record
        const [request] = await pool.execute(
            'SELECT user_id, course_id FROM certificate_requests WHERE id = ?',
            [requestId]
        );

        if (request.length > 0) {
            await pool.execute(
                'INSERT INTO certificates (user_id, roadmap_id, certificate_url) VALUES (?, ?, ?)',
                [request[0].user_id, request[0].course_id, `/certificates/${requestId}.html`]
            );
        }

        res.json({ message: 'Certificate request approved successfully' });
    } catch (error) {
        console.error('Error approving certificate request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
});