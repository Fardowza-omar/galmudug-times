import express from 'express';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import cors from 'cors';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import bodyParser from 'body-parser';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Use JWT_SECRET from environment, or generate once and persist to disk
function getOrCreateSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const secretFile = join(__dirname, '../data/.secret');
  if (fs.existsSync(secretFile)) {
    return fs.readFileSync(secretFile, 'utf8').trim();
  }
  const newSecret = crypto.randomBytes(64).toString('hex');
  try {
    if (!fs.existsSync(join(__dirname, '../data'))) fs.mkdirSync(join(__dirname, '../data'), { recursive: true });
    fs.writeFileSync(secretFile, newSecret, 'utf8');
  } catch (e) { /* non-fatal */ }
  return newSecret;
}
const SECRET_KEY = getOrCreateSecret();

// ---- Simple in-memory rate limiter (no extra dependency) ----
const loginAttempts = new Map(); // key = IP, value = { count, firstAttempt }
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 10;

function loginRateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    if (now - record.firstAttempt > RATE_LIMIT_WINDOW) {
      loginAttempts.set(ip, { count: 1, firstAttempt: now });
    } else if (record.count >= MAX_LOGIN_ATTEMPTS) {
      const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - record.firstAttempt)) / 1000);
      return res.status(429).json({ error: 'Too many login attempts. Please try again later.', retryAfter });
    } else {
      record.count++;
    }
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  }
  next();
}

// Clean up stale entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts) {
    if (now - record.firstAttempt > RATE_LIMIT_WINDOW) loginAttempts.delete(ip);
  }
}, 30 * 60 * 1000);

// Middleware
const allowedOrigins = [
  'https://galmudugtimes.com',
  'https://www.galmudugtimes.com',
  'http://galmudugtimes.com',
  'http://www.galmudugtimes.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Redirect .html URLs to clean URLs (301 permanent)
app.use((req, res, next) => {
  if (req.path.endsWith('.html') && !req.path.startsWith('/admin/')) {
    const clean = req.path.slice(0, -5).replace(/\/index$/, '') || '/';
    const qs = req._parsedUrl && req._parsedUrl.search ? req._parsedUrl.search : '';
    return res.redirect(301, clean + qs);
  }
  next();
});

// Serve static files with clean URL support (/contact → contact.html)
app.use(express.static(join(__dirname, '..'), { extensions: ['html'] }));
app.use('/uploads', express.static(join(__dirname, '../uploads')));  // Serve uploads
app.use('/admin', express.static(join(__dirname, '../admin')));  // Serve admin pages

// Redirect /admin and /admin/ to login page
app.get('/admin', (req, res) => res.redirect('/admin/login.html'));
app.get('/admin/', (req, res) => res.redirect('/admin/login.html'));

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename — keep only safe characters
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max for videos
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, WebP images and MP4/WebM/MOV videos are allowed'));
    }
  }
});

// Wrapper to handle multer errors as JSON responses
function uploadSingle(fieldName) {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
}

// Initialize SQLite Database
const dbPath = join(__dirname, '../data/articles.db');
const dbDir = join(__dirname, '../data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize Database Tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ,profile_image TEXT
      )
    `);
        // Migration: add profile_image column if missing
        db.all("PRAGMA table_info(users)", (err, columns) => {
          if (!err && Array.isArray(columns) && !columns.some(col => col.name === 'profile_image')) {
            db.run("ALTER TABLE users ADD COLUMN profile_image TEXT");
          }
        });

    // Categories table
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Comments table
    db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        author_name TEXT NOT NULL,
        author_email TEXT,
        content TEXT NOT NULL,
        approved INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      )
    `);

    // Likes table
    db.run(`
      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        identifier TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(article_id, identifier),
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      )
    `);

    // Subscribers table
    db.run(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ads table
    db.run(`
      CREATE TABLE IF NOT EXISTS ads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image TEXT,
        link TEXT,
        message TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Articles table
    db.run(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        content TEXT,
        category_id INTEGER,
        featured_image TEXT,
        article_url TEXT,
        video_url TEXT,
        author TEXT,
        status TEXT DEFAULT 'draft',
        is_breaking INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        published_at DATETIME,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Ensure is_breaking column exists on old databases (migration)
    db.run(`ALTER TABLE articles ADD COLUMN is_breaking INTEGER DEFAULT 0`, () => {});
    // Ensure video_url column exists
    db.run(`ALTER TABLE articles ADD COLUMN video_url TEXT`, () => {});
    // Ensure gallery_images column exists
    db.run(`ALTER TABLE articles ADD COLUMN gallery_images TEXT`, () => {});
    // Ensure author_id FK column exists (migration)
    db.run(`ALTER TABLE articles ADD COLUMN author_id INTEGER`, () => {
      // Backfill: set author_id for all articles to the admin user
      db.run(`UPDATE articles SET author_id = (SELECT id FROM users LIMIT 1) WHERE author_id IS NULL`, () => {});
    });
    // Ensure show_in_nav and nav_order columns exist on categories (migration)
    db.run(`ALTER TABLE categories ADD COLUMN show_in_nav INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE categories ADD COLUMN nav_order INTEGER DEFAULT 99`, () => {});
    db.run(`ALTER TABLE categories ADD COLUMN page_file TEXT`, () => {});

    // Insert default categories
    const categories = [
      { name: 'Politics', slug: 'politics', color: '#d63031' },
      { name: 'World', slug: 'world', color: '#1e90ff' },
      { name: 'Business', slug: 'business', color: '#27ae60' },
      { name: 'Technology', slug: 'technology', color: '#8e44ad' },
      { name: 'Opinion', slug: 'opinion', color: '#f39c12' },
      { name: 'Life & Culture', slug: 'culture', color: '#e74c3c' },
      { name: 'Analysis', slug: 'analysis', color: '#2c3e50' }
    ];

    categories.forEach(cat => {
      db.run(`
        INSERT OR IGNORE INTO categories (name, slug, color)
        VALUES (?, ?, ?)
      `, [cat.name, cat.slug, cat.color]);
    });

    // Create default admin user (if not exists)
    // Set ADMIN_USERNAME and ADMIN_PASSWORD in your .env file before first run
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const email = process.env.ADMIN_EMAIL || 'admin@galmudug-times.com';
    const hashedPassword = bcryptjs.hashSync(password, 10);

    db.run(`
      INSERT OR IGNORE INTO users (username, password, email)
      VALUES (?, ?, ?)
    `, [username, hashedPassword, email]);

    // Add sample articles if not exists
    addSampleArticles();

    console.log(`Database initialized. Admin user: ${username}`);
  });
}

// Add sample articles
function addSampleArticles() {
  const sampleArticles = [
    {
      title: 'Breaking: Major Economic Agreement Reached',
      slug: 'breaking-major-economic-agreement-reached',
      description: 'Leaders from 12 nations sign landmark trade accord affecting billions in commerce.',
      content: 'In a historic move, world leaders have signed a comprehensive economic agreement that is expected to reshape global trade patterns. The accord includes provisions for tariff reductions, technology transfers, and joint infrastructure projects. Economists estimate the deal could generate $2 trillion in new economic activity over the next decade.\n\nThe agreement was reached after six months of intensive negotiations involving delegates from major economies worldwide. "This represents a turning point in international cooperation," said a senior diplomat at the signing ceremony.\n\nThe accord includes groundbreaking provisions for climate initiatives, cybersecurity standards, and artificial intelligence governance. Environmental groups have praised the environmental provisions as "the most ambitious climate commitment in trade history."',
      category_id: 1, // Politics
      author: 'James Wilson',
      status: 'published',
      published_at: new Date().toISOString()
    },
    {
      title: 'Tech Giants Announce Joint AI Research Initiative',
      slug: 'tech-giants-announce-joint-ai-research',
      description: 'Five leading technology companies form consortium to advance artificial intelligence safely and responsibly.',
      content: 'In a surprising display of cooperation, five major technology companies announced the formation of the Global AI Research Consortium. The initiative aims to develop ethical AI standards and prevent potential misuse of artificial intelligence.\n\nThe consortium includes provisions for open-source research, shared datasets, and joint safety protocols. "This collaboration will accelerate responsible AI development," stated the consortium\'s director.\n\nThe move comes amid growing scrutiny of AI development and calls for international regulation. Industry analysts view this as a significant step toward self-governance in the tech sector.',
      category_id: 4, // Technology
      author: 'Sarah Johnson',
      status: 'published',
      published_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      title: 'Global Markets React Positively to New Trade Deal',
      slug: 'global-markets-react-positively-trade-deal',
      description: 'Stock indices surge as investors welcome framework for stable international commerce.',
      content: 'Financial markets around the world rallied following the announcement of the new trade agreement. The S&P 500 gained 2.3%, while international indices also posted strong gains.\n\n"Investors had been waiting for clarity on trade policy," said a market analyst. "This agreement provides exactly that."\n\nThe currency markets also stabilized, with major currencies showing less volatility. Bond yields moved higher, reflecting increased investor confidence in economic growth. Emerging market equities, particularly those in Asia and Latin America, outperformed developed markets.',
      category_id: 3, // Business
      author: 'Michael Chen',
      status: 'published',
      published_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
      title: 'World Leaders Commit to Climate Action Plan',
      slug: 'world-leaders-commit-climate-action-plan',
      description: 'United Nations summit produces binding agreement on emissions reduction targets.',
      content: 'Delegates from 195 nations agreed on ambitious targets for carbon emissions reduction. The new framework commits signatories to net-zero emissions by 2050, with intermediate targets for 2030 and 2040.\n\n"This is the moment we take serious action on climate change," declared the UN Secretary-General.\n\nThe agreement includes $100 billion annually in climate finance for developing nations and establishes a global carbon pricing mechanism. Environmental organizations have called it "the most significant climate agreement since Paris."',
      category_id: 2, // World
      author: 'Emma Thompson',
      status: 'published',
      published_at: new Date(Date.now() - 259200000).toISOString()
    },
    {
      title: 'Opinion: The Future of Global Cooperation',
      slug: 'opinion-future-global-cooperation',
      description: 'Columnist reflects on what recent agreements mean for international relations.',
      content: 'The recent wave of international agreements suggests we may be witnessing a fundamental shift in global politics. After years of nationalist posturing and trade wars, nations are returning to multilateralism and cooperation.\n\nThis represents both opportunity and challenge. While cooperation on trade and climate is welcome, we must remain vigilant about protecting our own interests and values.\n\n"The next decade will define whether we can build truly sustainable global institutions," observes the author. The success or failure of these agreements will shape international relations for generations to come.',
      category_id: 5, // Opinion
      author: 'Dr. Patricia Martinez',
      status: 'published',
      published_at: new Date(Date.now() - 345600000).toISOString()
    },
    {
      title: 'Cultural Exchange Program Launched Across Continents',
      slug: 'cultural-exchange-program-launched',
      description: 'New initiative brings artists, musicians, and performers from around the world together.',
      content: 'A new international cultural exchange program has been launched, bringing together artists and performers from diverse backgrounds. The initiative seeks to promote mutual understanding and celebrate global creativity.\n\nParticipants will have opportunities for collaborative projects, exhibitions, and performances across multiple countries. "Culture is a universal language," said the program director.\n\nThe first exchange cohort includes representatives from 47 countries, spanning visual arts, music, theater, and literature. The program aims to break down cultural barriers and foster lasting international friendships through creative collaboration.',
      category_id: 6, // Culture
      author: 'Isabella Rossi',
      status: 'published',
      published_at: new Date(Date.now() - 432000000).toISOString()
    }
  ];

  sampleArticles.forEach(article => {
    db.get('SELECT id FROM articles WHERE slug = ?', [article.slug], (err, row) => {
      if (!row) {
        db.run(`
          INSERT INTO articles (title, slug, description, content, category_id, author, status, published_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [article.title, article.slug, article.description, article.content, article.category_id, article.author, article.status, article.published_at]);
      }
    });
  });
}

// ==================== Authentication Routes ====================

// Login endpoint (rate-limited)
app.post('/api/auth/login', loginRateLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!bcryptjs.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, profile_image: user.profile_image || null } });
  });
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, created_at, profile_image FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Update user profile (username and email)
app.put('/api/auth/profile', authenticateToken, (req, res) => {
  upload.single('profile_image')(req, res, function(err) {
    if (err) return res.status(400).json({ error: err.message });
    const username = req.body.username;
    const email = req.body.email;
    let profile_image = null;
    if (req.file) profile_image = `/uploads/${req.file.filename}`;
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }
    db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id], (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existing) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      // If new image uploaded, update it, else keep old
      if (profile_image) {
        db.run('UPDATE users SET username = ?, email = ?, profile_image = ? WHERE id = ?', [username, email, profile_image, req.user.id], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update profile' });
          }
          res.json({ message: 'Profile updated successfully', username, email, profile_image });
        });
      } else {
        db.run('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, req.user.id], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update profile' });
          }
          db.get('SELECT profile_image FROM users WHERE id = ?', [req.user.id], (err2, row) => {
            res.json({ message: 'Profile updated successfully', username, email, profile_image: row ? row.profile_image : null });
          });
        });
      }
    });
  });
});

// Change password
app.put('/api/auth/password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  db.get('SELECT password FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!bcryptjs.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = bcryptjs.hashSync(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update password' });
      }
      res.json({ message: 'Password changed successfully' });
    });
  });
});

// Verify token middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// ==================== Categories Routes ====================

// Get all categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(categories);
  });
});

// Get categories for navigation (only visible ones, ordered)
// Falls back to showing ALL categories if none are marked show_in_nav
app.get('/api/categories/nav/visible', (req, res) => {
  db.all('SELECT * FROM categories WHERE show_in_nav = 1 ORDER BY nav_order ASC, name ASC', (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    // If no categories are flagged for nav, return all of them
    if (categories.length === 0) {
      db.all('SELECT * FROM categories ORDER BY name ASC', (err2, allCats) => {
        if (err2) return res.status(500).json({ error: 'Database error' });
        res.json(allCats);
      });
    } else {
      res.json(categories);
    }
  });
});

// Get category by slug
app.get('/api/categories/:slug', (req, res) => {
  db.get('SELECT * FROM categories WHERE slug = ?', [req.params.slug], (err, category) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  });
});

// Create new category (admin only)
app.post('/api/categories', authenticateToken, (req, res) => {
  const { name, color, show_in_nav, nav_order, page_file } = req.body;
  
  if (!name || !color) {
    return res.status(400).json({ error: 'Name and color are required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  db.run(`
    INSERT INTO categories (name, slug, color, show_in_nav, nav_order, page_file)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [name, slug, color, show_in_nav ? 1 : 0, nav_order || 99, page_file || null], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Category name already exists' });
      }
      return res.status(500).json({ error: 'Failed to create category' });
    }
    res.json({ id: this.lastID, name, slug, color, show_in_nav: show_in_nav ? 1 : 0, nav_order: nav_order || 99, page_file, message: 'Category created successfully' });
  });
});

// Update category (admin only)
app.put('/api/categories/:id', authenticateToken, (req, res) => {
  const { name, color, show_in_nav, nav_order, page_file } = req.body;
  const id = req.params.id;

  if (!name || !color) {
    return res.status(400).json({ error: 'Name and color are required' });
  }

  // Update all editable fields
  db.run(`
    UPDATE categories 
    SET name = ?, color = ?, show_in_nav = ?, nav_order = ?, page_file = ?
    WHERE id = ?
  `, [name, color, show_in_nav ? 1 : 0, nav_order || 99, page_file || null, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update category' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    // Return the current slug (unchanged)
    db.get('SELECT slug FROM categories WHERE id = ?', [id], (err2, row) => {
      res.json({ id, name, slug: row ? row.slug : '', color, show_in_nav: show_in_nav ? 1 : 0, nav_order: nav_order || 99, page_file, message: 'Category updated successfully' });
    });
  });
});

// Delete category (admin only)
app.delete('/api/categories/:id', authenticateToken, (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete category' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  });
});

// ==================== Articles Routes ====================

// Get all articles (public - published only)
app.get('/api/articles', (req, res) => {
  const { category, limit = 20, offset = 0 } = req.query;
  let query = `SELECT a.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
    u.profile_image as author_profile_image
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.author_id = u.id
    WHERE a.status = 'published'`;
  let params = [];

  if (category) {
    query += ' AND a.category_id = (SELECT id FROM categories WHERE slug = ?)';
    params.push(category);
  }

  query += ' ORDER BY a.published_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, articles) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(articles);
  });
});

// Get featured articles
app.get('/api/articles/featured/latest', (req, res) => {
  db.all(`
    SELECT a.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
      u.profile_image as author_profile_image
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.author_id = u.id
    WHERE a.status = 'published'
    ORDER BY a.published_at DESC
    LIMIT 30
  `, (err, articles) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(articles);
  });
});

// Get single article by slug
app.get('/api/articles/:slug', (req, res) => {
  db.get(`
    SELECT a.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
      u.profile_image as author_profile_image
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.author_id = u.id
    WHERE a.slug = ? AND a.status = 'published'
  `, [req.params.slug], (err, article) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    // Increment view count
    db.run('UPDATE articles SET views = views + 1 WHERE id = ?', [article.id]);
    res.json(article);
  });
});


// Create article (admin only, support image and video upload)
app.post('/api/articles', authenticateToken, (req, res, next) => {
  upload.fields([
    { name: 'featured_image', maxCount: 1 },
    { name: 'video_file', maxCount: 1 },
    { name: 'gallery_images', maxCount: 10 }
  ])(req, res, function(err) {
    if (err) return res.status(400).json({ error: err.message });
    const { title, description, content, category_id, status, article_url, video_url, is_breaking } = req.body;
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const featured_image = req.files && req.files['featured_image'] ? `/uploads/${req.files['featured_image'][0].filename}` : null;
    // Gallery images (multiple)
    const gallery_images = req.files && req.files['gallery_images'] 
      ? JSON.stringify(req.files['gallery_images'].map(f => `/uploads/${f.filename}`))
      : null;
    // Prefer uploaded video file over URL if present
    let videoPath = req.files && req.files['video_file'] ? `/uploads/${req.files['video_file'][0].filename}` : null;
    const finalVideoUrl = videoPath || (video_url || null);
    const published_at = status === 'published' ? new Date().toISOString() : null;
    const autoDesc = description || content.replace(/<[^>]*>/g, '').substring(0, 220).trim();
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    // Always use the logged-in admin's current display name from DB
    db.get('SELECT username FROM users WHERE id = ?', [req.user.id], (userErr, userRow) => {
    const authorName = (userRow && userRow.username) || req.user.username || 'Galmudug Times';
    db.get('SELECT id FROM articles WHERE slug = ?', [baseSlug], (slugErr, existing) => {
      const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;
      db.run(`
        INSERT INTO articles (title, slug, description, content, category_id, featured_image, gallery_images, article_url, video_url, author, author_id, status, is_breaking, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [title, slug, autoDesc, content, category_id || null, featured_image, gallery_images, article_url || null, finalVideoUrl, authorName, req.user.id, status || 'draft', is_breaking ? 1 : 0, published_at], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, slug, message: 'Article created successfully' });
      });
    });
    }); // end users lookup
  });
});


// Update article (admin only, support image and video upload)
app.put('/api/articles/:id', authenticateToken, (req, res, next) => {
  upload.fields([
    { name: 'featured_image', maxCount: 1 },
    { name: 'video_file', maxCount: 1 },
    { name: 'gallery_images', maxCount: 10 }
  ])(req, res, function(err) {
    if (err) return res.status(400).json({ error: err.message });
    const { title, description, content, category_id, author, status, article_url, video_url, is_breaking } = req.body;
    const id = req.params.id;
    db.get('SELECT * FROM articles WHERE id = ?', [id], (err, article) => {
      if (err || !article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      const featured_image = req.files && req.files['featured_image'] ? `/uploads/${req.files['featured_image'][0].filename}` : article.featured_image;
      // Gallery images - append new ones to existing
      let gallery_images = article.gallery_images;
      if (req.files && req.files['gallery_images']) {
        const newGallery = req.files['gallery_images'].map(f => `/uploads/${f.filename}`);
        const existingGallery = article.gallery_images ? JSON.parse(article.gallery_images) : [];
        gallery_images = JSON.stringify([...existingGallery, ...newGallery]);
      }
      let videoPath = req.files && req.files['video_file'] ? `/uploads/${req.files['video_file'][0].filename}` : null;
      const finalVideoUrl = videoPath || video_url || article.video_url;
      const published_at = status === 'published' && !article.published_at ? new Date().toISOString() : article.published_at;
      const breakingVal = is_breaking !== undefined ? (is_breaking ? 1 : 0) : article.is_breaking;
      db.run(`
        UPDATE articles
        SET title = ?, description = ?, content = ?, category_id = ?, featured_image = ?, gallery_images = ?, article_url = ?, video_url = ?, author = ?, status = ?, is_breaking = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [title || article.title, description || article.description, content || article.content, category_id || article.category_id, featured_image, gallery_images, article_url || article.article_url || null, finalVideoUrl, author || article.author, status || article.status, breakingVal, published_at, id], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ error: 'Failed to update article' });
        }
        res.json({ message: 'Article updated successfully' });
      });
    });
  });
});

// Delete article (admin only)
app.delete('/api/articles/:id', authenticateToken, (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM articles WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete article' });
    }
    res.json({ message: 'Article deleted successfully' });
  });
});

// Get all articles for admin (published + drafts)
app.get('/api/admin/articles', authenticateToken, (req, res) => {
  db.all(`
    SELECT a.*, c.name as category_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    ORDER BY a.created_at DESC
  `, (err, articles) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(articles);
  });
});

// ==================== Search Route ====================

app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const like = `%${q}%`;
  db.all(`
    SELECT a.id, a.title, a.slug, a.description, a.author, a.published_at, a.featured_image,
           c.name as category_name, c.slug as category_slug, c.color as category_color
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = 'published'
      AND (a.title LIKE ? OR a.description LIKE ? OR a.content LIKE ? OR a.author LIKE ?)
    ORDER BY a.published_at DESC
    LIMIT 20
  `, [like, like, like, like], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// ==================== Breaking News Route ====================

app.get('/api/breaking-news', (req, res) => {
  db.all(`
    SELECT title, slug, id FROM articles
    WHERE status = 'published' AND is_breaking = 1
    ORDER BY published_at DESC LIMIT 8
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    // Fall back to latest articles if no breaking news set
    if (rows.length === 0) {
      db.all(`SELECT title, slug, id FROM articles WHERE status='published' ORDER BY published_at DESC LIMIT 5`, (e2, fallback) => {
        res.json(fallback || []);
      });
    } else {
      res.json(rows);
    }
  });
});

// ==================== Article by ID ====================

app.get('/api/articles/id/:id', (req, res) => {
  db.get(`
    SELECT a.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
      u.profile_image as author_profile_image
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.author_id = u.id
    WHERE a.id = ? AND a.status = 'published'
  `, [req.params.id], (err, article) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    db.run('UPDATE articles SET views = views + 1 WHERE id = ?', [article.id]);
    res.json(article);
  });
});

// ==================== Comments Routes ====================

// Get comments for an article
app.get('/api/articles/:id/comments', (req, res) => {
  db.all(`
    SELECT id, author_name, content, created_at
    FROM comments
    WHERE article_id = ? AND approved = 1
    ORDER BY created_at ASC
  `, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// Post a comment
app.post('/api/articles/:id/comments', (req, res) => {
  const { author_name, author_email, content } = req.body;
  const article_id = req.params.id;

  if (!author_name || !content) {
    return res.status(400).json({ error: 'Name and comment are required' });
  }
  if (author_name.length > 100 || content.length > 2000) {
    return res.status(400).json({ error: 'Input too long' });
  }

  // Sanitise: strip any HTML tags
  const safeName = author_name.replace(/<[^>]*>/g, '').trim();
  const safeContent = content.replace(/<[^>]*>/g, '').trim();
  const safeEmail = (author_email || '').replace(/<[^>]*>/g, '').trim();

  db.run(`
    INSERT INTO comments (article_id, author_name, author_email, content)
    VALUES (?, ?, ?, ?)
  `, [article_id, safeName, safeEmail, safeContent], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to post comment' });
    res.status(201).json({ id: this.lastID, message: 'Comment posted' });
  });
});

// ==================== Likes Routes ====================

// Get like count + status for an article
app.get('/api/articles/:id/likes', (req, res) => {
  const article_id = req.params.id;
  const identifier = req.headers['x-client-token'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  db.get(`SELECT COUNT(*) as count FROM likes WHERE article_id = ?`, [article_id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    db.get(`SELECT id FROM likes WHERE article_id = ? AND identifier = ?`, [article_id, identifier], (e2, liked) => {
      res.json({ count: row ? row.count : 0, liked: !!liked });
    });
  });
});

// Toggle like for an article (identifier = forwarded-for or x-real-ip or a client token)
app.post('/api/articles/:id/like', (req, res) => {
  const article_id = req.params.id;
  // Use client-supplied token (stored in localStorage) so each browser is treated as a unique user
  const identifier = req.headers['x-client-token'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  db.get(`SELECT id FROM likes WHERE article_id = ? AND identifier = ?`, [article_id, identifier], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (row) {
      // Already liked — unlike
      db.run(`DELETE FROM likes WHERE article_id = ? AND identifier = ?`, [article_id, identifier], () => {
        db.get(`SELECT COUNT(*) as count FROM likes WHERE article_id = ?`, [article_id], (e2, r2) => {
          res.json({ liked: false, count: r2 ? r2.count : 0 });
        });
      });
    } else {
      db.run(`INSERT INTO likes (article_id, identifier) VALUES (?, ?)`, [article_id, identifier], () => {
        db.get(`SELECT COUNT(*) as count FROM likes WHERE article_id = ?`, [article_id], (e2, r2) => {
          res.json({ liked: true, count: r2 ? r2.count : 0 });
        });
      });
    }
  });
});

// ==================== Admin Comments Moderation ====================

app.get('/api/admin/comments', authenticateToken, (req, res) => {
  db.all(`
    SELECT c.*, a.title as article_title, a.slug as article_slug
    FROM comments c
    LEFT JOIN articles a ON c.article_id = a.id
    ORDER BY c.created_at DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.patch('/api/admin/comments/:id', authenticateToken, (req, res) => {
  const { approved } = req.body;
  db.run(`UPDATE comments SET approved = ? WHERE id = ?`, [approved ? 1 : 0, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'Updated' });
  });
});

app.delete('/api/admin/comments/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM comments WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'Deleted' });
  });
});

// ==================== Subscribe Routes ====================

app.post('/api/subscribe', (req, res) => {
  const { email, name } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  db.run(`INSERT INTO subscribers (email, name) VALUES (?, ?)`, [email.toLowerCase().trim(), (name || '').trim()], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'This email is already subscribed!' });
      return res.status(500).json({ error: 'Could not subscribe. Please try again.' });
    }
    res.json({ message: 'Subscribed successfully! Thank you.' });
  });
});

app.get('/api/admin/subscribers', authenticateToken, (req, res) => {
  db.all(`SELECT id, email, name, subscribed_at FROM subscribers ORDER BY subscribed_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.delete('/api/admin/subscribers/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM subscribers WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'Subscriber removed' });
  });
});

// ==================== Backup & Reset Routes ====================

// Download database backup
app.get('/api/admin/backup', authenticateToken, (req, res) => {
  const backupName = `galmudug-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
  res.setHeader('Content-Disposition', `attachment; filename="${backupName}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.sendFile(dbPath);
});

// Delete all articles (reset)
app.delete('/api/admin/reset-articles', authenticateToken, (req, res) => {
  db.run('DELETE FROM articles', [], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to clear articles' });
    db.run('DELETE FROM sqlite_sequence WHERE name = "articles"', [], () => {});
    res.json({ message: 'All articles deleted', count: this.changes });
  });
});

// ==================== Ads API ====================

// Get all active ads (public)
app.get('/api/ads', (req, res) => {
  db.all('SELECT * FROM ads WHERE active = 1 ORDER BY created_at DESC', [], (err, ads) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(ads);
  });
});

// Create ad (admin only, with optional image upload)
app.post('/api/ads', authenticateToken, (req, res) => {
  upload.single('image')(req, res, function(err) {
    if (err) return res.status(400).json({ error: err.message });
    const { link, message } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    db.run(
      'INSERT INTO ads (image, link, message) VALUES (?, ?, ?)',
      [image, link || null, message || null],
      function(insertErr) {
        if (insertErr) return res.status(500).json({ error: 'Failed to create ad' });
        res.json({ id: this.lastID, image, link, message, active: 1 });
      }
    );
  });
});

// Update ad (admin only)
app.put('/api/ads/:id', authenticateToken, (req, res) => {
  const { link, message, active } = req.body;
  db.run(
    'UPDATE ads SET link = ?, message = ?, active = ? WHERE id = ?',
    [link || null, message || null, active !== undefined ? active : 1, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to update ad' });
      if (this.changes === 0) return res.status(404).json({ error: 'Ad not found' });
      res.json({ message: 'Ad updated' });
    }
  );
});

// Delete ad (admin only)
app.delete('/api/ads/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM ads WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to delete ad' });
    if (this.changes === 0) return res.status(404).json({ error: 'Ad not found' });
    res.json({ message: 'Ad deleted' });
  });
});

// ==================== Server Start ====================

app.listen(PORT, () => {
  console.log(`[OK] Galmudug Times running on http://localhost:${PORT}`);
  console.log(`[OK] Admin Dashboard: http://localhost:${PORT}/admin/`);
});
