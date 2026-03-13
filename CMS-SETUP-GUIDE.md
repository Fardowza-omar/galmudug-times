# The Record — CMS Setup & Installation Guide

## 📋 What You Have

A complete **Content Management System (CMS)** for managing news articles with:

- **Admin Dashboard** — Add, edit, delete articles
- **Secure Login** — Username/password authentication with JWT tokens
- **Database** — SQLite for storing articles and users
- **File Upload** — Support for images and videos
- **Categories** — Organize articles by topic (Politics, World, Business, etc.)
- **Public Website** — Display published articles to readers

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Node.js
If you don't have Node.js installed:
1. Go to [nodejs.org](https://nodejs.org)
2. Download and install the LTS version
3. Verify installation: Open Command Prompt and type:
   ```
   node --version
   npm --version
   ```

### Step 2: Install Dependencies
Open PowerShell or Command Prompt and navigate to the API folder:

```powershell
cd "c:\Users\hp\Downloads\Galmudug times\api"
npm install
```

This will install all required packages (Express, SQLite, authentication, etc.)

### Step 3: Start the Server
In the same PowerShell window:

```powershell
npm start
```

You should see:
```
✓ The Record CMS Server running on http://localhost:3000
✓ Admin Dashboard: http://localhost:3000/admin/login.html
✓ Default credentials: admin / admin123
```

### Step 4: Access the Admin Dashboard
1. Open your browser
2. Go to: `http://localhost:3000/admin/login.html`
3. Login with:
   - **Username:** admin
   - **Password:** admin123

---

## 🎯 How to Use the CMS

### Adding a New Article

1. Click **"+ New Article"** button in the dashboard
2. Fill in the form:
   - **Title** — Your article headline
   - **Category** — Select from Politics, World, Business, etc.
   - **Author** — Who wrote it
   - **Description** — Brief summary (shows in listings)
   - **Content** — Full article text
   - **Featured Image** — Upload a cover image
   - **Status** — Draft or Publish

3. Click **"Save Article"**

### Editing Articles

1. Find the article in the table
2. Click **"Edit"** button
3. Modify the content
4. Click **"Save Article"**

### Publishing Articles

- Change Status to **"Publish"** before saving
- Published articles appear on the website immediately

### Deleting Articles

1. Click **"Delete"** button
2. Confirm deletion
3. Article is removed from the database

---

## 📱 Accessing Your Website

**Public Website:** `http://localhost:3000/`

Articles will automatically appear on:
- **Home Page** — Latest articles
- **Category Pages** — Politics, World, Business, etc.
- **Article Pages** — Full article view with comments (upcoming)

---

## 🗄️ Database Structure

The system automatically creates a SQLite database with tables for:

### Users Table
- Stores admin login credentials (hashed passwords)

### Categories Table
- Politics, World, Business, Technology, Opinion, Life & Culture, Analysis
- Each category has its own color

### Articles Table
- Title, slug, description, content
- Category ID, author, published date
- Featured image path
- View count
- Status (draft/published)

---

## 🔐 Security Features

- **Hashed Passwords** — Using bcryptjs (passwords never stored in plain text)
- **JWT Authentication** — Secure token-based login system
- **File Upload Validation** — Only images and videos allowed
- **CORS Protection** — Cross-origin request control

**⚠️ Production Security Note:**
In production, change the `SECRET_KEY` in `/api/server.js`:

```javascript
const SECRET_KEY = 'your-new-secret-key-here';
```

---

## 📂 File Structure

```
Galmudug times/
├── index.html              (Home page - shows latest articles)
├── article.html            (Article detail page)
├── politics.html           (Politics section)
├── world.html             (World section)
├── business.html          (Business section)
├── technology.html        (Technology section)
├── opinion.html           (Opinion section)
├── culture.html           (Life & Culture section)
├── styles.css             (Public website styles)
├── admin/
│   ├── login.html         (Admin login page)
│   ├── dashboard.html     (Admin dashboard - manage articles)
│   └── admin.css          (Admin dashboard styles)
├── api/
│   ├── server.js          (Express backend server)
│   ├── package.json       (Node.js dependencies)
│   └── .env              (Configuration)
├── uploads/               (Article images stored here - auto-created)
└── data/
    └── articles.db        (SQLite database - auto-created)
```

---

## 🛠️ API Endpoints

The backend provides these API endpoints:

### Authentication
- `POST /api/auth/login` — User login

### Articles (Public)
- `GET /api/articles` — List all published articles
- `GET /api/articles/:slug` — Get single article
- `GET /api/articles/featured/latest` — Get featured articles
- `POST /api/articles` — Create article (requires auth)
- `PUT /api/articles/:id` — Update article (requires auth)
- `DELETE /api/articles/:id` — Delete article (requires auth)

### Admin Articles
- `GET /api/admin/articles` — Get all articles (drafts + published)

### Categories
- `GET /api/categories` — List all categories
- `GET /api/categories/:slug` — Get category by slug

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
If you see "Port 3000 already in use":
1. Find the process using port 3000
2. Kill it or change PORT in `.env`

### Database Locked Error
The database file may be corrupted. Solution:
1. Stop the server
2. Delete `data/articles.db`
3. Restart the server (it will recreate it)

### Login Not Working
1. Verify the server is running
2. Check that you're using the correct credentials (admin / admin123)
3. Check browser console for errors (F12)

### Images Not Uploading
1. Ensure the `/uploads` folder exists and is writable
2. Check file size (max 5MB)
3. Use only JPG, PNG, GIF formats

---

## 📊 Default Admin User

**Username:** admin  
**Password:** admin123  
**Email:** admin@therecord.com

⚠️ Change this password on your first login (in production)

---

## 🚀 Deploying to Production

For production deployment:

1. **Change SECRET_KEY** in `/api/server.js`
2. **Use environment variables** instead of hardcoded values
3. **Set up HTTPS** with SSL certificates
4. **Use a production database** (PostgreSQL recommended)
5. **Add Nginx/Apache** as reverse proxy
6. **Enable rate limiting** to prevent abuse
7. **Set up backups** for the database

---

## 📝 Adding More Features (Future)

The system is designed to be extensible. You can add:

- User profiles for multiple authors
- Article comments and ratings
- Tag system for better categorization
- Search functionality
- Article schedules (publish at specific time)
- Newsletter subscriptions
- Social media integration
- Analytics dashboard

---

## ❓ Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console for error messages (F12 in browser)
3. Check server logs in the terminal

---

**Version:** 1.0.0  
**Created:** March 2026  
**Framework:** Node.js + Express + SQLite
