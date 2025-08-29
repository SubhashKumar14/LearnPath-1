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
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        // Roadmaps started/completed
        const [roadmapRows] = await pool.execute(`
            SELECT ur.roadmap_id,
                   COUNT(t.id) as total_tasks,
                   SUM(CASE WHEN up.completed = 1 THEN 1 ELSE 0 END) as done
            FROM user_roadmaps ur
            JOIN roadmaps r ON ur.roadmap_id = r.id
            LEFT JOIN modules m ON r.id = m.roadmap_id
            LEFT JOIN tasks t ON m.id = t.module_id
            LEFT JOIN user_progress up ON up.task_id = t.id AND up.user_id = ur.user_id
            WHERE ur.user_id = ?
            GROUP BY ur.roadmap_id`, [userId]);
        let roadmapsStarted = roadmapRows.length;
        let roadmapsCompleted = roadmapRows.filter(r => r.total_tasks > 0 && r.total_tasks === r.done).length;
        const tasksCompleted = roadmapRows.reduce((sum, r) => sum + r.done, 0);
        const [certCount] = await pool.execute('SELECT COUNT(*) as certificates FROM certificates WHERE user_id = ?', [userId]);
        const [badgeCount] = await pool.execute('SELECT COUNT(*) as badges FROM badges WHERE user_id = ?', [userId]);
        res.json({
            roadmapsStarted,
            roadmapsCompleted,
            tasksCompleted,
            badgesEarned: badgeCount[0].badges || 0,
            certificatesEarned: certCount[0].certificates || 0
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

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

app.post('/api/certificates/request', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { roadmapId } = req.body;
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
            return res.status(400).json({ error: 'Complete all tasks before requesting a certificate' });
        }
        const certificateUrl = `/certificates/${userId}_${roadmapId}_${Date.now()}.pdf`;
        await pool.execute('INSERT INTO certificates (user_id, roadmap_id, certificate_url) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE certificate_url = VALUES(certificate_url), issued_at = NOW()', [userId, roadmapId, certificateUrl]);
        res.json({ message: 'Certificate issued successfully', certificateUrl });
    } catch (error) {
        console.error('Error issuing certificate:', error);
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
                (SELECT COUNT(*) FROM modules) as total_modules,
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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
});