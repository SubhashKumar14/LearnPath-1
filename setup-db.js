const mysql = require('mysql2/promise');
const fs = require('fs');

async function setupDatabase() {
    console.log('🔧 Setting up database...');
    
    // Try different password configurations
    const configs = [
        { host: 'localhost', user: 'root', password: '' },
        { host: 'localhost', user: 'root', password: 'root' },
        { host: 'localhost', user: 'root', password: 'password' },
        { host: 'localhost', user: 'root', password: 'admin' },
        { host: 'localhost', user: 'root', password: '123456' }
    ];
    
    let connection = null;
    
    for (const config of configs) {
        try {
            console.log(`🔍 Trying to connect with password: '${config.password || '(empty)'}'`);
            connection = await mysql.createConnection({
                ...config,
                multipleStatements: true
            });
            console.log('✅ Database connection successful!');
            console.log(`📝 Updating .env file with working configuration...`);
            
            // Update .env file
            const envContent = `# Database Configuration
DB_HOST=${config.host}
DB_USER=${config.user}
DB_PASSWORD=${config.password}
DB_NAME=learnpath_db

# JWT Secret Key (change this in production)
JWT_SECRET=learnpath_secret_key_change_in_production

# Server Port
PORT=3000`;
            
            fs.writeFileSync('.env', envContent);
            break;
        } catch (error) {
            console.log(`❌ Failed with password '${config.password || '(empty)'}': ${error.message}`);
        }
    }
    
    if (!connection) {
        console.log('❌ Could not connect to MySQL with any common password.');
        console.log('💡 Please ensure MySQL is running and check your root password.');
        console.log('💡 You can reset MySQL root password or create a new user with appropriate privileges.');
        return;
    }
    
    try {
        // Read and execute schema
        const schema = fs.readFileSync('schema.sql', 'utf8');
        
        // Execute the entire schema as one query with multipleStatements
        await connection.query(schema);
        
        console.log('✅ Database schema created successfully!');
        console.log('✅ Sample data inserted!');
        
    } catch (error) {
        console.error('❌ Error setting up database:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();
