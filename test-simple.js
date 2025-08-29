const http = require('http');

function testAPI() {
    console.log('🧪 Testing API with native http module...');
    
    const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/roadmaps',
        method: 'GET'
    }, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log(`✅ Received ${jsonData.length} roadmaps`);
                console.log('First roadmap:', jsonData[0]?.title);
                console.log('🎉 API test successful!');
            } catch (error) {
                console.log('Raw response:', data);
                console.error('JSON parse error:', error.message);
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('Request error:', error.message);
    });
    
    req.setTimeout(5000, () => {
        console.error('Request timeout');
        req.abort();
    });
    
    req.end();
}

testAPI();
