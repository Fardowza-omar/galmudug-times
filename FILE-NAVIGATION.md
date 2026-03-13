# File Directory & Navigation Guide

## 📂 Complete File Structure

```
c:\Users\hp\Downloads\Galmudug times\
│
├─ 📖 DOCUMENTATION (READ THESE FIRST!)
│  ├─ QUICK-START.md ⭐ START HERE! (2-5 minute setup)
│  ├─ CMS-SETUP-GUIDE.md (complete installation guide)
│  ├─ SYSTEM-OVERVIEW.md (how everything works)
│  └─ README.md (design documentation)
│
├─ 🌐 PUBLIC WEBSITE (What readers see)
│  ├─ index.html (home page - latest articles)
│  ├─ article.html (individual article page)
│  ├─ politics.html (politics section)
│  ├─ world.html (world news section)
│  ├─ business.html (business section)
│  ├─ technology.html (tech section)
│  ├─ opinion.html (opinion section)
│  ├─ culture.html (life & culture section)
│  └─ styles.css (all styling)
│
├─ 🔐 ADMIN PANEL (Journalist CMS)
│  └─ admin/
│     ├─ login.html (secure login page)
│     └─ dashboard.html (manage articles interface)
│
├─ 🖥️ BACKEND SERVER (Node.js API)
│  └─ api/
│     ├─ server.js (main Express backend)
│     ├─ package.json (dependencies list)
│     └─ .env (configuration file)
│
├─ 📊 DATABASE (Auto-created, don't touch)
│  └─ data/
│     └─ articles.db (SQLite database)
│
├─ 📸 UPLOADS (Auto-created, article images)
│  └─ uploads/
│     └─ (your images saved here)
│
└─ ⚙️ SCRIPTS
   └─ start-cms.bat (one-click startup for Windows)
```

---

## 🎯 File Purposes

### Documentation (Read First)
| File | Purpose | Time |
|------|---------|------|
| `QUICK-START.md` | Get running in 2 minutes | ⭐ START |
| `CMS-SETUP-GUIDE.md` | Detailed setup & troubleshooting | 5 min |
| `SYSTEM-OVERVIEW.md` | How the system works | 10 min |
| `README.md` | Design documentation | Reference |

### Website Files (Public Pages)
| File | What It Is | Who Sees It |
|------|-----------|-----------|
| `index.html` | Home page (latest articles) | Everyone |
| `article.html` | Full article view | Everyone |
| `politics.html` | Politics section | Everyone |
| `world.html` | World news section | Everyone |
| `business.html` | Business section | Everyone |
| `technology.html` | Tech section | Everyone |
| `opinion.html` | Opinion section | Everyone |
| `culture.html` | Arts & culture section | Everyone |
| `styles.css` | All website styling | Applied to all pages |

### Admin Files (CMS - Journalist Only)
| File | What It Is | Access |
|------|-----------|--------|
| `admin/login.html` | Admin login page | http://localhost:3000/admin/login.html |
| `admin/dashboard.html` | Article management | After login |

### Backend Files (Server)
| File | Purpose | Notes |
|------|---------|-------|
| `api/server.js` | Express backend server | Main application logic |
| `api/package.json` | Node packages to install | Don't edit manually |
| `api/.env` | Configuration settings | Change PORT or SECRET_KEY here |

### Auto-Created Folders (Don't Touch)
| Folder | Purpose | Auto-Created |
|--------|---------|--------------|
| `data/` | SQLite database storage | Yes, on first run |
| `uploads/` | Uploaded article images | Yes, on first upload |

---

## 🚀 How to Use Each File

### To START the System
1. Open PowerShell
2. Run: `cd c:\Users\hp\Downloads\Galmudug times\api`
3. Run: `npm install` (first time only)
4. Run: `npm start`
5. See: "Server running on http://localhost:3000"

### To ACCESS the Writer Dashboard
1. Open browser
2. Go to: `http://localhost:3000/admin/login.html`
3. Login: admin / admin123
4. Create/edit/delete articles

### To VIEW the Public Website
1. Open browser
2. Go to: `http://localhost:3000/`
3. See published articles
4. Click category links (politics, world, business, etc.)

### To CUSTOMIZE the Website
1. Edit `styles.css` for design changes
2. Edit `index.html` for homepage layout changes
3. Restart server to see changes

### To CHANGE ADMIN CREDENTIALS
1. Edit `api/server.js`
2. Find line with: `admin123`
3. Change to new password
4. Restart server

### To ADD A NEW CATEGORY
1. Edit `api/server.js`
2. Find the `categories` array
3. Add new category object
4. Restart server

---

## 📊 Database Structure (data/articles.db)

Tables automatically created:

### Users Table
Stores admin login credentials
- id
- username
- password (hashed)
- email
- created_at

### Categories Table  
News categories
- id
- name (Politics, World, etc.)
- slug (politics, world, etc.)
- color (hex color code)
- created_at

### Articles Table
Published/draft articles
- id
- title
- slug (URL-friendly)
- description
- content
- category_id
- featured_image
- author
- status (published/draft)
- views
- created_at
- updated_at
- published_at

---

## 🌐 URL Routes

Once server is running:

### Public Website Routes
| URL | Page | Content |
|-----|------|---------|
| `http://localhost:3000/` | Home | Latest articles |
| `http://localhost:3000/politics.html` | Politics | Politics articles |
| `http://localhost:3000/world.html` | World | World news |
| `http://localhost:3000/business.html` | Business | Business news |
| `http://localhost:3000/technology.html` | Tech | Technology articles |
| `http://localhost:3000/opinion.html` | Opinion | Opinion pieces |
| `http://localhost:3000/culture.html` | Culture | Arts & culture |
| `http://localhost:3000/article.html?slug=xyz` | Full Article | Individual article |

### Admin Routes
| URL | Page | Purpose |
|-----|------|---------|
| `http://localhost:3000/admin/login.html` | Login | Admin authentication |
| `http://localhost:3000/admin/dashboard.html` | Dashboard | Article management |

### API Routes (Backend - Don't visit directly)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Login & get token |
| `/api/articles` | GET | Get published articles |
| `/api/articles` | POST | Create new article |
| `/api/articles/:id` | PUT | Edit article |
| `/api/articles/:id` | DELETE | Delete article |
| `/api/categories` | GET | Get all categories |
| `/api/uploads/*` | GET | Access uploaded images |

---

## 💾 File Sizes

| File | Size | Type |
|------|------|------|
| `api/server.js` | ~15 KB | Backend code |
| `styles.css` | ~35 KB | Stylesheet |
| `admin/dashboard.html` | ~45 KB | Admin interface |
| `index.html` | ~8 KB | Home page |
| `article.html` | ~8 KB | Article template |
| Each category page | ~8 KB | Section page |

---

## 🔄 File Dependencies

### These files depend on the server running:
- `admin/login.html` → `api/server.js`
- `admin/dashboard.html` → `api/server.js`
- `index.html` → `api/server.js` (when pulling articles)
- Category pages → `api/server.js`

### These files work independently:
- `styles.css` (loaded by all HTML files)
- `article.html` (needs slug parameter)

---

## ✏️ Which Files to Edit

### To Change Website Design
Edit: `styles.css`

### To Change Website Layout
Edit: `index.html`, `politics.html`, etc.

### To Change Admin Interface
Edit: `admin/dashboard.html`

### To Change Server Behavior
Edit: `api/server.js`

### To Change Configuration
Edit: `api/.env`

---

## 🆘 File Troubleshooting

### "Can't find file X"
→ Check the path is correct. Use `pwd` in PowerShell to verify current location

### "Database corrupted"
→ Safe to delete: `data/articles.db` (will recreate on startup)

### "Images not uploading"
→ Check `uploads/` folder exists and has write permissions

### "CSS not loading"
→ Ensure server is running and `styles.css` path is correct

### "Admin panel not showing"
→ Check URL is `http://localhost:3000/admin/dashboard.html`

---

## 📋 Checklist for First Run

- [ ] Read `QUICK-START.md`
- [ ] Install Node.js from nodejs.org
- [ ] Open PowerShell in project folder
- [ ] Run `cd api && npm install`
- [ ] Run `npm start`
- [ ] Visit `http://localhost:3000/admin/login.html`
- [ ] Login with admin/admin123
- [ ] Create first article
- [ ] Visit `http://localhost:3000/` to see it
- [ ] Celebrate! 🎉

---

## 🎯 Quick Navigation

- **"How do I start?" →** Read `QUICK-START.md`
- **"How does it work?" →** Read `SYSTEM-OVERVIEW.md`
- **"I'm stuck" →** Read `CMS-SETUP-GUIDE.md`
- **"Design guide" →** Read `README.md`
- **"I need help now" →** Check the file table above

---

**Remember:** Keep your server running in PowerShell while using the admin panel!

**Status:** ✅ All files ready to use  
**Created:** March 2026
