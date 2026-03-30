// Script to clean up duplicate/test categories
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

async function cleanupCategories() {
  console.log('\nCLEANUP - Removing Duplicate Test Categories\n');

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
    console.log('[OK] Logged in successfully\n');

    // Get all categories
    const catsRes = await makeRequest('GET', '/api/categories', null);
    const categories = catsRes.body;

    console.log(`Found ${categories.length} total categories\n`);
    console.log('Categories:');
    console.log('-----------------------------------------------------\n');

    const toDelete = [];
    const defaultCategories = [
      'Politics', 'World', 'Business', 'Technology', 
      'Opinion', 'Life & Culture', 'Analysis'
    ];

    categories.forEach((cat, idx) => {
      console.log(`${idx + 1}. [ID: ${cat.id}] ${cat.name}`);
      console.log(`   Slug: ${cat.slug} | Color: ${cat.color}\n`);

      // Identify test/duplicate categories
      if (cat.name.includes('Test Category') || 
          /\d{13}/.test(cat.name)) { // Timestamp pattern
        console.log(`   [!] TEST/DUPLICATE CATEGORY - Will be deleted\n`);
        toDelete.push(cat.id);
      } else if (!defaultCategories.includes(cat.name)) {
        console.log(`   (i) Non-default category (keeping)\n`);
      }
    });

    if (toDelete.length === 0) {
      console.log('[OK] No duplicate test categories found. Database is clean!\n');
      return;
    }

    console.log('-----------------------------------------------------');
    console.log(`\n[!] Found ${toDelete.length} test/duplicate categories to remove\n`);

    // Delete test categories
    console.log('Deleting...\n');
    for (const id of toDelete) {
      const deleteRes = await makeRequest('DELETE', `/api/categories/${id}`, null, token);
      if (deleteRes.status === 200) {
        console.log(`[OK] Deleted category ID ${id}`);
      } else {
        console.log(`[FAIL] Failed to delete category ID ${id}`);
      }
    }

console.log('\n[DONE] Cleanup complete!\n');

    // Verify
    const finalRes = await makeRequest('GET', '/api/categories', null);
    console.log(`Now have ${finalRes.body.length} categories in database\n`);
    console.log('Remaining categories:');
    finalRes.body.forEach(cat => {
      console.log(`  - ${cat.name}`);
    });
    console.log('\n-----------------------------------------------------\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

cleanupCategories();
