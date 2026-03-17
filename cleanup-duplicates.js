// Script to identify and remove duplicate/test articles
const http = require('http');

function makeRequest(method, path, data, token = null) {
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

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

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

async function cleanup() {
  console.log('\n🗑️  CLEANUP - Removing Duplicate Test Articles\n');

  try {
    // Login
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    if (loginRes.status !== 200) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginRes.body.token;
    console.log('✓ Logged in successfully\n');

    // Get all articles
    const articlesRes = await makeRequest('GET', '/api/admin/articles', null, token);
    const articles = articlesRes.body;

    console.log(`Found ${articles.length} total articles\n`);
    console.log('Articles to review:');
    console.log('─────────────────────────────────────────────────────────\n');

    let testCount = 0;
    const toDelete = [];

    articles.forEach((article, idx) => {
      console.log(`${idx + 1}. [ID: ${article.id}] ${article.title}`);
      console.log(`   Status: ${article.status} | Created: ${new Date(article.created_at).toLocaleDateString()}`);

      // Identify test articles (created by test suite with timestamp in title)
      if (article.title.includes('Test Draft Article') || 
          article.title.includes('Test Published Article') ||
          article.title.includes('Updated Draft Article') ||
          article.title.includes('Test Article')) {
        console.log(`   ⚠️  TEST/DUPLICATE ARTICLE - Will be deleted\n`);
        toDelete.push(article.id);
        testCount++;
      } else {
        console.log('');
      }
    });

    if (toDelete.length === 0) {
      console.log('✓ No test articles found. Database is clean!\n');
      return;
    }

    console.log('─────────────────────────────────────────────────────────');
    console.log(`\n📋 Found ${toDelete.length} test/duplicate articles to remove\n`);

    // Delete test articles
    console.log('Deleting...\n');
    for (const id of toDelete) {
      const deleteRes = await makeRequest('DELETE', `/api/articles/${id}`, null, token);
      if (deleteRes.status === 200) {
        console.log(`✓ Deleted article ID ${id}`);
      } else {
        console.log(`✗ Failed to delete article ID ${id}`);
      }
    }

    console.log('\n✅ Cleanup complete!\n');

    // Verify
    const finalRes = await makeRequest('GET', '/api/admin/articles', null, token);
    console.log(`📊 Now have ${finalRes.body.length} articles in database`);
    console.log('─────────────────────────────────────────────────────────\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

cleanup();
