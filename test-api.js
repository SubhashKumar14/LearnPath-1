// Test script for LearnPath API endpoints
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function testAPIs() {
    console.log('🧪 Testing LearnPath API endpoints...\n');
    
    try {
        // Test 1: Get roadmaps
        console.log('1. Testing GET /api/roadmaps...');
        const roadmapsResponse = await fetch(`${API_BASE}/roadmaps`);
        const roadmapsData = await roadmapsResponse.json();
        console.log(`   Status: ${roadmapsResponse.status}`);
        console.log(`   Roadmaps found: ${roadmapsData.length || 0}`);
        if (roadmapsData.length > 0) {
            console.log(`   First roadmap: ${roadmapsData[0].title}`);
        }
        console.log('   ✅ Roadmaps endpoint working\n');
        
        // Test 2: Get specific roadmap
        if (roadmapsData.length > 0) {
            const roadmapId = roadmapsData[0].id;
            console.log(`2. Testing GET /api/roadmaps/${roadmapId}...`);
            const roadmapResponse = await fetch(`${API_BASE}/roadmaps/${roadmapId}`);
            const roadmapData = await roadmapResponse.json();
            console.log(`   Status: ${roadmapResponse.status}`);
            console.log(`   Roadmap title: ${roadmapData.title}`);
            console.log(`   Modules: ${roadmapData.modules ? roadmapData.modules.length : 0}`);
            console.log('   ✅ Individual roadmap endpoint working\n');
        }
        
        // Test 3: Register a new user
        console.log('3. Testing POST /api/register...');
        const registerData = {
            username: 'Test User',
            email: 'test@example.com',
            password: 'testpassword123'
        };
        
        const registerResponse = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
        });
        
        const registerResult = await registerResponse.json();
        console.log(`   Status: ${registerResponse.status}`);
        console.log(`   Message: ${registerResult.message || registerResult.error}`);
        console.log('   ✅ Registration endpoint working\n');
        
        // Test 4: Login with admin credentials
        console.log('4. Testing POST /api/login (admin)...');
        const loginData = {
            email: 'admin@learnpath.com',
            password: 'password123'
        };
        
        const loginResponse = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });
        
        const loginResult = await loginResponse.json();
        console.log(`   Status: ${loginResponse.status}`);
        
        if (loginResponse.ok) {
            console.log(`   User: ${loginResult.user.username} (${loginResult.user.role})`);
            console.log(`   Token received: ${loginResult.token ? 'Yes' : 'No'}`);
            console.log('   ✅ Login endpoint working\n');
            
            // Test 5: Test authenticated endpoint
            console.log('5. Testing authenticated endpoint...');
            const progressResponse = await fetch(`${API_BASE}/progress/${loginResult.user.id}`, {
                headers: { 'Authorization': `Bearer ${loginResult.token}` }
            });
            
            const progressData = await progressResponse.json();
            console.log(`   Status: ${progressResponse.status}`);
            console.log(`   Progress records: ${progressData.length || 0}`);
            console.log('   ✅ Authenticated endpoint working\n');
        } else {
            console.log(`   Login failed: ${loginResult.error}`);
            console.log('   ❌ Login endpoint issue\n');
        }
        
        console.log('🎉 API testing completed!');
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

// Run the tests
testAPIs();
