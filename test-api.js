// Simple test script to verify API functionality
const http = require('http');

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  console.log('Testing Galmudug Times API...\n');

  try {
    // Test login
    console.log('1. Testing login with admin/admin123...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log(`   Status: ${loginRes.status}`);
    if (loginRes.status === 200) {
      console.log(`   ✓ Login successful! Token length: ${loginRes.body.token?.length || 0}`);
      const token = loginRes.body.token;

      // Test article creation
      console.log('\n2. Testing article creation...');
      const createRes = await makeRequest('POST', '/api/articles', {
        title: 'Test Article ' + Date.now(),
        content: 'This is a test article',
        category_id: 1,
        status: 'draft',
        author: 'Test User'
      });
      
      // For this test, we need to send the token in the header
      // Let's make a direct test instead
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/articles',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      const createReq = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          console.log(`   Status: ${res.statusCode}`);
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode === 201) {
              console.log(`   ✓ Article created! ID: ${parsed.id}`);
            } else {
              console.log(`   ✗ Error: ${parsed.error || parsed.message}`);
            }
          } catch (e) {
            console.log(`   ✗ Error: ${body}`);
          }
          
          console.log('\n3. Testing article retrieval...');
          makeRequest('GET', '/api/articles?limit=5', null).then(res => {
            console.log(`   Status: ${res.status}`);
            console.log(`   ✓ Found ${res.body?.length || 0} articles`);
            console.log('\nAll tests completed!');
          });
        });
      });

      createReq.write(JSON.stringify({
        title: 'Test Article ' + Date.now(),
        content: 'This is a test article content that should work properly for publishing.',
        category_id: 1,
        status: 'draft',
        author: 'Test User'
      }));
      createReq.end();

    } else {
      console.log(`   ✗ Login failed with status ${loginRes.status}`);
      console.log(`   ${JSON.stringify(loginRes.body)}`);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

test();
