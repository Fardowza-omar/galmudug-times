# ?? Galmudug Times - Modern News Portal CMS

A professional, full-stack news portal content management system inspired by The Washington Post. Built with Node.js, Express, and SQLite for easy deployment and management.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## ? Features

### ?? Content Management
- **Article Publishing** - Create, edit, and manage articles with rich content
- **Breaking News** - Mark articles as breaking news to appear in the scrolling ticker
- **Categories** - Organize content with customizable categories and colors
- **Media Support** - Upload images and embed YouTube/Vimeo videos
- **Draft System** - Save articles as drafts before publishing

### ?? Frontend
- **Washington Post-inspired Design** - Clean, professional newspaper aesthetic
- **Responsive Layout** - Works perfectly on desktop, tablet, and mobile
- **Dynamic Navigation** - Admin-controlled menu items and ordering
- **Breaking News Ticker** - Animated scrolling ticker for urgent news
- **Search Functionality** - Full-text search across all articles
- **Comments & Likes** - Reader engagement features

### ?? Admin Dashboard
- **Intuitive Interface** - Easy-to-use admin panel for non-technical users
- **User Management** - Update profile, email, and password
- **Category Control** - Create categories and control which appear in navigation
- **Comments Moderation** - Approve or delete reader comments
- **Statistics** - View article counts, views, and engagement metrics

## ?? Quick Start

### Prerequisites
- Node.js 14+ installed
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/galmudug-times.git
cd galmudug-times

# Install dependencies
cd api
npm install

# Start the server
npm start
```

### Access
- **Frontend:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **Default Login:** admin / admin123

> ?? **Important:** Change the default password after first login!

## ?? Project Structure

```
galmudug-times/
+-- api/
¦   +-- server.js          # Express backend server
¦   +-- package.json       # Node dependencies
+-- data/
¦   +-- articles.db        # SQLite database (auto-created)
+-- js/
¦   +-- category.js        # Category page loader
¦   +-- nav.js             # Dynamic navigation
+-- uploads/               # Uploaded images
+-- admin/
¦   +-- dashboard.html     # Admin panel
¦   +-- login.html         # Admin login
+-- index.html             # Homepage
+-- article.html           # Article detail page
+-- category.html          # Dynamic category page
+-- styles.css             # Main stylesheet
+-- [category].html        # Static category pages
```

## ??? Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js, Express |
| Database | SQLite3 |
| Authentication | JWT, bcryptjs |
| Frontend | Vanilla HTML/CSS/JS |
| Fonts | Google Fonts (Playfair Display, Inter) |

## ?? Configuration

### Database
The SQLite database is automatically created on first run with default categories:
- Politics, World, Business, Technology, Opinion, Culture

## ?? API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/articles | Get all articles |
| GET | /api/articles/:slug | Get single article |
| POST | /api/articles | Create article (auth) |
| PUT | /api/articles/:id | Update article (auth) |
| DELETE | /api/articles/:id | Delete article (auth) |
| GET | /api/categories | Get all categories |
| POST | /api/auth/login | Admin login |
| GET | /api/breaking-news | Get breaking news |
| GET | /api/search?q=query | Search articles |

## ?? Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ?? License

This project is licensed under the MIT License.

---

**Made with ?? for quality journalism**
