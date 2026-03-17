// Comprehensive test of Galmudug Times functionality
const http = require('http');

let testsPassed = 0;
let testsFailed = 0;

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

function test(name, passed, details = '') {
  if (passed) {
    console.log(`✓ ${name}`);
    testsPassed++;
  } else {
    console.log(`✗ ${name}`);
    if (details) console.log(`  Error: ${details}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  GALMUDUG TIMES - COMPREHENSIVE FUNCTIONALITY TEST');
  console.log('═══════════════════════════════════════════════════\n');

  let authToken = null;
  let articleId = null;

  try {
    // ========== AUTHENTICATION TESTS ==========
    console.log('📋 AUTHENTICATION TESTS');
    console.log('─────────────────────────────────────────────────');

    // Test 1: Admin Login
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    authToken = loginRes.body.token;
    test('Admin login with correct credentials', 
      loginRes.status === 200 && authToken && loginRes.body.user);

    // Test 2: Failed Login
    const failedLoginRes = await makeRequest('POST', '/api/auth/login', {
      username: 'admin',
      password: 'wrongpassword'
    });
    test('Login fails with wrong password', failedLoginRes.status === 401);

    // Test 3: Get Profile
    const profileRes = await makeRequest('GET', '/api/auth/profile', null, authToken);
    test('Get user profile after login', 
      profileRes.status === 200 && profileRes.body.username === 'admin');

    // ========== CATEGORIES TESTS ==========
    console.log('\n📁 CATEGORY TESTS');
    console.log('─────────────────────────────────────────────────');

    // Test 4: Get Categories
    const catsRes = await makeRequest('GET', '/api/categories', null);
    const categories = catsRes.body;
    test('Retrieve all categories', 
      catsRes.status === 200 && Array.isArray(categories) && categories.length > 0);

    // Test 5: Create Category (Admin only)
    const newCatRes = await makeRequest('POST', '/api/categories', {
      name: 'Test Category ' + Date.now(),
      color: '#ff0000',
      show_in_nav: 1,
      nav_order: 1
    }, authToken);
    test('Create new category (authenticated)', 
      newCatRes.status === 200 && newCatRes.body.id);

    // ========== ARTICLE TESTS ==========
    console.log('\n📰 ARTICLE TESTS');
    console.log('─────────────────────────────────────────────────');

    // Test 6: Create Draft Article
    const draftRes = await makeRequest('POST', '/api/articles', {
      title: 'Test Draft Article ' + Date.now(),
      description: 'This is a test article draft',
      content: 'Full article content goes here. Testing the publishing system.',
      category_id: 1,
      author: 'Test Admin',
      status: 'draft'
    }, authToken);
    articleId = draftRes.body.id;
    test('Create article in DRAFT status', 
      draftRes.status === 201 && articleId);

    // Test 7: Create Published Article
    const publishRes = await makeRequest('POST', '/api/articles', {
      title: 'Test Published Article ' + Date.now(),
      description: 'This article is published and visible',
      content: 'This is a published article that appears on the homepage and category pages.',
      category_id: 1,
      author: 'Test Admin',
      status: 'published',
      is_breaking: 1
    }, authToken);
    test('Create article in PUBLISHED status with breaking flag', 
      publishRes.status === 201 && publishRes.body.id);

    // Test 8: Get Article (Public - Published Only)
    const articlesRes = await makeRequest('GET', '/api/articles?limit=10', null);
    test('Retrieve published articles (public)', 
      articlesRes.status === 200 && Array.isArray(articlesRes.body));

    // Test 9: Get All Articles for Admin
    const adminArticlesRes = await makeRequest('GET', '/api/admin/articles', null, authToken);
    test('Retrieve all articles for admin (draft + published)', 
      adminArticlesRes.status === 200 && Array.isArray(adminArticlesRes.body) && 
      adminArticlesRes.body.length > 0);

    // Test 10: Update Article
    if (articleId) {
      const updateRes = await makeRequest('PUT', `/api/articles/${articleId}`, {
        title: 'Updated Draft Article ' + Date.now(),
        content: 'Updated content - changed status to published',
        status: 'published'
      }, authToken);
      test('Update article (change from draft to published)', updateRes.status === 200);
    }

    // Test 11: Get Breaking News
    const breakingRes = await makeRequest('GET', '/api/breaking-news', null);
    test('Retrieve breaking news articles', 
      breakingRes.status === 200 && Array.isArray(breakingRes.body));

    // ========== SEARCH TESTS ==========
    console.log('\n🔍 SEARCH TESTS');
    console.log('─────────────────────────────────────────────────');

    // Test 12: Search Articles
    const searchRes = await makeRequest('GET', '/api/search?q=breaking', null);
    test('Search articles by keyword', 
      searchRes.status === 200 && Array.isArray(searchRes.body));

    // ========== COMMENTS TESTS ==========
    console.log('\n💬 COMMENT TESTS');
    console.log('─────────────────────────────────────────────────');

    // Test 13: Post Comment
    if (articleId) {
      const commentRes = await makeRequest('POST', `/api/articles/${articleId}/comments`, {
        author_name: 'Test Reader',
        author_email: 'test@example.com',
        content: 'Great article! This is a test comment.'
      });
      test('Post comment on article', commentRes.status === 201);
    }

    // Test 14: Get Comments
    if (articleId) {
      const commentsRes = await makeRequest('GET', `/api/articles/${articleId}/comments`, null);
      test('Retrieve comments for article', 
        commentsRes.status === 200 && Array.isArray(commentsRes.body));
    }

    // ========== LIKES TESTS ==========
    console.log('\n👍 LIKES TESTS');
    console.log('─────────────────────────────────────────────────');

    // Test 15: Toggle Like
    if (articleId) {
      const likeRes = await makeRequest('POST', `/api/articles/${articleId}/like`, {});
      test('Like/unlike article', 
        likeRes.status === 200 && (likeRes.body.liked === true || likeRes.body.liked === false));
    }

    // Test 16: Get Like Count
    if (articleId) {
      const likeCountRes = await makeRequest('GET', `/api/articles/${articleId}/likes`, null);
      test('Get article like count', 
        likeCountRes.status === 200 && typeof likeCountRes.body.count === 'number');
    }

    // ========== ADMIN ONLY TESTS ==========
    console.log('\n🔐 ADMIN OPERATIONS TESTS');
    console.log('─────────────────────────────────────────────────');

    // Test 17: Get Admin Comments
    const adminCommentsRes = await makeRequest('GET', '/api/admin/comments', null, authToken);
    test('Admin: Retrieve all comments for moderation', 
      adminCommentsRes.status === 200 && Array.isArray(adminCommentsRes.body));

    // Test 18: Unauthorized Access
    const unauthorizedRes = await makeRequest('GET', '/api/admin/articles', null);
    test('Prevent unauthorized access to admin endpoints', 
      unauthorizedRes.status === 401 || unauthorizedRes.status === 403);

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    testsFailed++;
  }

  // ========== SUMMARY ==========
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✓ Passed: ${testsPassed}`);
  console.log(`✗ Failed: ${testsFailed}`);
  console.log(`📊 Total: ${testsPassed + testsFailed}`);
  console.log(`⚡ Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
  console.log('═══════════════════════════════════════════════════\n');

  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! Your CMS is working perfectly!\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
  }
}

runTests();
