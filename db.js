const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'learnpath_db',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    maxIdle: parseInt(process.env.DB_MAX_IDLE) || 10,
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 60000,
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: 'Z',
    charset: 'utf8mb4'
};

const pool = mysql.createPool(dbConfig);

async function testConnection(retries = 3, delay = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const connection = await pool.getConnection();
            console.log('✅ Database connected successfully');
            
            await connection.execute('SELECT 1 as test');
            console.log('✅ Database query test passed');
            
            connection.release();
            return true;
            
        } catch (error) {
            console.error(`❌ Database connection attempt ${attempt}/${retries} failed:`, error.message);
            
            if (attempt === retries) {
                console.error('❌ All database connection attempts failed');
                console.error('Please check your database configuration and ensure MySQL is running');
                return false;
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function healthCheck() {
    try {
        const connection = await pool.getConnection();
        await connection.execute('SELECT 1 as health');
        connection.release();
        return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
        return { 
            status: 'unhealthy', 
            error: error.message, 
            timestamp: new Date().toISOString() 
        };
    }
}

module.exports = {
    pool,
    testConnection,
    healthCheck
};