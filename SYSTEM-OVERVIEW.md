# The Record — Complete CMS System Documentation

## 🎯 What Has Been Built

A **professional news portal with a complete Content Management System (CMS)** that allows a journalist to:

1. **Login securely** to an admin dashboard
2. **Create news articles** with title, description, images, content, categories
3. **Edit articles** after publishing
4. **Delete articles** removing them from the website
5. **Upload images** to make articles visually appealing
6. **Organize articles** into categories (Politics, World, Business, Technology, Opinion, Culture, Analysis)
7. **Manage publication status** (Draft vs. Published)
8. **View statistics** on total articles, published count, draft count, and total views

---

## 📁 What's Included

### 1. **Public Website** (Reader-Facing)
- **Home Page** (`index.html`) — Shows latest news articles
- **Article Page** (`article.html`) — Full article view with images
- **Category Pages** — Organized by topic:
  - Politics (`politics.html`)
  - World (`world.html`)
  - Business (`business.html`)
  - Technology (`technology.html`)
  - Opinion (`opinion.html`)
  - Life & Culture (`culture.html`)
- **Styles** (`styles.css`) — Premium Journal of Record design

### 2. **Admin Dashboard** (CMS)
- **Login Page** (`admin/login.html`) — Secure authentication
- **Dashboard** (`admin/dashboard.html`) — Complete article management interface

### 3. **Backend Server** (API)
- **Express Server** (`api/server.js`) — Node.js/Express REST API
- **Database** (SQLite) — Stores articles, users, categories
- **File Upload** — Handles image and video uploads
- **Authentication** — JWT-based secure login

### 4. **Configuration & Setup**
- **Package.json** (`api/package.json`) — Node.js dependencies
- **Setup Guide** (`CMS-SETUP-GUIDE.md`) — Complete installation instructions
- **Quick Start** (`start-cms.bat`) — One-click startup script

---

## 🔄 How It Works

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PUBLIC WEBSITE                        │
│  (Home, Articles, Categories - Read-Only for Readers)  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ↓ API Calls (GET published articles)                  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                    EXPRESS BACKEND                       │
│              (REST API on localhost:3000)               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Endpoints:                                      │   │
│  │  - /api/articles (GET published)               │   │
│  │  - /api/articles/:slug (GET single)            │   │
│  │  - /api/articles (POST - create)               │   │
│  │  - /api/articles/:id (PUT - edit)              │   │
│  │  - /api/articles/:id (DELETE - remove)         │   │
│  │  - /api/auth/login (authenticate)              │   │
│  │  - /api/categories (GET all)                   │   │
│  │  - /api/uploads (static files)                 │   │
│  └─────────────────────────────────────────────────┘   │
│                         ↓                                │
├─────────────────────────────────────────────────────────┤
│                   SQLite DATABASE                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Tables:                                          │   │
│  │ - users (admin login credentials)               │   │
│  │ - articles (news articles)                      │   │
│  │ - categories (article categories)               │   │
│  └─────────────────────────────────────────────────┘   │
│                         ↑                                │
└────┬────────────────────────────────────────────────────┘
     │
     │ API Calls (POST/PUT/DELETE articles + images)
     │
┌────────────────────────────────────────────────────────┐
│              ADMIN DASHBOARD (CMS)                      │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 1. Login Page (admin/login.html)                 │ │
│  │    - Username/Password authentication            │ │
│  │    - JWT token generation                        │ │
│  └──────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 2. Dashboard (admin/dashboard.html)              │ │
│  │    - Article list with status                    │ │
│  │    - Add new article button                      │ │
│  │    - Edit/Delete/View actions                    │ │
│  │    - File upload with preview                    │ │
│  │    - Category selection                          │ │
│  │    - Status management (draft/publish)           │ │
│  │    - Statistics cards                            │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started (Step-by-Step)

### Option A: Quick Start (Easiest)

1. **Open PowerShell** in the "Galmudug times" folder
2. **Double-click** `start-cms.bat`
3. Wait for "Server running on http://localhost:3000"
4. **Open browser** to `http://localhost:3000/admin/login.html`
5. **Login with:** admin / admin123

### Option B: Manual Setup

1. **Install Node.js** from nodejs.org
2. **Open PowerShell** in the folder
3. **Run:**
   ```powershell
   cd api
   npm install
   npm start
   ```
4. Access at `http://localhost:3000/admin/login.html`

---

## 💡 Using the CMS

### Login Process
1. Go to `http://localhost:3000/admin/login.html`
2. Use default credentials:
   - **Username:** admin
   - **Password:** admin123
3. Click "Sign In"
4. Redirects to dashboard after successful login

### Creating an Article
1. Click **"+ New Article"** button
2. Fill in the form:
   - **Title** — The headline
   - **Category** — Select from dropdown
   - **Author** — Who wrote it
   - **Description** — Brief summary (shows in listings)
   - **Content** — Full article text
   - **Featured Image** — Drag/drop or click to upload
   - **Status** — Draft (save without publishing) or Published
3. Click **"Save Article"**
4. Article appears on website if status = Published

### Editing an Article
1. Find article in the dashboard table
2. Click **"Edit"** button
3. Modify any field
4. Click **"Save Article"**
5. Changes appear immediately on the website

### Publishing an Article
1. Create article with Status = Draft
2. Edit the article later
3. Change Status to "Published"
4. Click "Save Article"
5. Article now appears on the public website

### Deleting an Article
1. Click **"Delete"** next to the article
2. Confirm deletion
3. Article is removed from database and website

---

## 📊 Admin Dashboard Features

### Statistics Cards
- **Total Articles** — Count of all articles (draft + published)
- **Published** — Count of live articles on website
- **Drafts** — Count of articles not yet published
- **Total Views** — Sum of all article views

### Articles Table
Shows all articles with:
- **Title** — Article headline
- **Category** — Which section it belongs to
- **Status** — Draft or Published (color-coded badge)
- **Date** — When article was created
- **Views** — How many times it's been viewed
- **Actions** — Edit, Delete, View buttons

---

## 🔐 Security Features

### Authentication
- **JWT Tokens** — Secure, time-expiring login tokens
- **Hashed Passwords** — User passwords encoded with bcryptjs
- **Token Validation** — Every admin action requires valid token

### Authorization
- Only authenticated users can create/edit/delete articles
- Public website can only see published articles
- Draft articles hidden from public view

### File Upload
- **Validation** — Only images/videos allowed
- **Size Limit** — Max 5MB per file
- **Isolation** — Files stored in `/uploads` folder

---

## 📱 How Readers Experience the Website

### Home Page (`index.html`)
1. Shows latest published articles
2. Articles organized by category
3. Each article has:
   - Title (clickable to read full article)
   - Category label (color-coded)
   - Description
   - Featured image
   - Author and date

### Category Pages
1. **Politics** — Shows only politics articles
2. **World** — International news
3. **Business** — Market and economy news
4. **Technology** — Tech news
5. **Opinion** — Analysis and opinion pieces
6. **Culture** — Arts, books, entertainment
7. Each shows latest articles in that category

### Article Page (`article.html`)
1. Full article content
2. Large featured image
3. Author information
4. Publication date
5. Related articles in sidebar
6. Subscribe button

---

## 🗄️ Database Design

### Users Table
```
id (auto-increment)
username (unique)
password (hashed/encrypted)
email (unique)
created_at (timestamp)
```

### Categories Table
```
id (auto-increment)
name (Politics, World, Business, etc.)
slug (url-friendly: politics, world, etc.)
color (hex color code: #d63031, #1e90ff, etc.)
created_at (timestamp)
```

### Articles Table
```
id (auto-increment)
title (article headline)
slug (url-friendly: historic-accord-reached)
description (brief summary)
content (full article text)
category_id (links to categories table)
featured_image (path to image file)
author (author name)
status (draft or published)
views (view counter)
created_at (when created)
updated_at (last modification)
published_at (when published)
```

---

## 🌐 API Endpoints Reference

### Authentication
- `POST /api/auth/login`
  - **Input:** `{ username, password }`
  - **Output:** `{ token, user }`

### Articles (Public - GET Only)
- `GET /api/articles` — List all published articles
- `GET /api/articles?category=politics` — Filter by category
- `GET /api/articles/:slug` — Get single article details
- `GET /api/articles/featured/latest` — Get latest featured articles

### Articles (Admin - Full CRUD)
- `POST /api/articles` — Create new article (requires auth)
- `PUT /api/articles/:id` — Update article (requires auth)
- `DELETE /api/articles/:id` — Delete article (requires auth)
- `GET /api/admin/articles` — List all articles including drafts (requires auth)

### Categories
- `GET /api/categories` — List all categories
- `GET /api/categories/:slug` — Get category details

### File Upload
- Files uploaded via form automatically stored in `/uploads`
- Accessible at `http://localhost:3000/uploads/filename`

---

## ⚙️ Configuration

### Default Admin User
- **Username:** admin
- **Password:** admin123
- **Email:** admin@therecord.com

Change these in production!

### Environment Variables (`.env`)
```
SECRET_KEY=your-secret-key-change-this-in-production
PORT=3000
```

### Default Categories (Auto-Created)
1. Politics (#d63031 - Red)
2. World (#1e90ff - Blue)
3. Business (#27ae60 - Green)
4. Technology (#8e44ad - Purple)
5. Opinion (#f39c12 - Gold)
6. Life & Culture (#e74c3c - Coral)
7. Analysis (#2c3e50 - Dark Gray)

---

## 🛠️ Technical Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js + Express.js |
| **Database** | SQLite 3 |
| **Authentication** | JWT + bcryptjs |
| **File Upload** | Multer |
| **Frontend** | HTML5 + CSS3 + Vanilla JavaScript |
| **API** | RESTful JSON API |
| **Server Port** | 3000 |

---

## 📈 File Sizes & Performance

- **JavaScript Bundle:** ~50KB (lightweight, vanilla JS)
- **CSS Stylesheets:** ~100KB (professional design)
- **Database:** Starts at ~10KB (grows with articles)
- **Images:** Depends on uploads (consider compression)

---

## 🚀 Scaling & Production

### For Production Deployment:

1. **Database:** Migrate to PostgreSQL or MySQL
2. **Authentication:** Implement OAuth 2.0 / OpenID Connect
3. **Caching:** Add Redis for article caching
4. **CDN:** Use CloudFlare for image delivery
5. **Monitoring:** Add error tracking (Sentry)
6. **Backups:** Implement automated database backups
7. **Analytics:** Add Google Analytics or Matomo

---

## 📞 Support & Troubleshooting

### Server Won't Start
1. **Port 3000 in use?** Kill the process or change PORT in `.env`
2. **Node.js not installed?** Download from nodejs.org
3. **Dependencies missing?** Run `npm install` in `/api` folder

### Login Issues
1. **Wrong credentials?** Use admin/admin123 (default)
2. **Token expired?** Close browser or refresh (7-day expiration)
3. **Server error?** Check console (F12) for error messages

### Database Corrupted
1. Stop the server
2. Delete `/data/articles.db`
3. Restart server (it recreates automatically)

### Images Not Showing
1. Ensure `/uploads` folder exists
2. Check image file paths in database
3. Verify image file sizes < 5MB

---

## 📝 Next Steps

1. **Run the server** using `start-cms.bat`
2. **Login** with admin/admin123
3. **Create your first article**
4. **Publish it** to see it on the website
5. **Customize** the categories and styling
6. **Change the default password** in production

---

**Status:** ✅ Complete and Ready to Use  
**Version:** 1.0.0  
**Created:** March 2026  
**Framework:** Node.js + SQLite + Express
