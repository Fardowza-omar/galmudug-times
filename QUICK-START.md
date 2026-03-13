# 🎉 The Record CMS — Welcome & Quick Start

## ✅ What You Now Have

A **complete, professional news CMS website** with:

✓ Beautiful news portal design (like Washington Post/New York Times)  
✓ Secure admin login system  
✓ Create, edit, delete news articles  
✓ Upload article images  
✓ Organize articles by categories  
✓ Publish/draft article management  
✓ Article statistics & analytics  
✓ SQLite database for storage  

---

## 🚀 Start Using It NOW (2 Steps)

### Step 1: Install Dependencies
Open **PowerShell** in the "Galmudug times" folder and run:

```powershell
cd api
npm install
```

This downloads all the software needed.

### Step 2: Start the Server
In the same PowerShell, run:

```powershell
npm start
```

You should see:
```
✓ The Record CMS Server running on http://localhost:3000
✓ Admin Dashboard: http://localhost:3000/admin/login.html
✓ Default credentials: admin / admin123
```

---

## 🔑 Access Your CMS

**Open Your Browser:**
- **Admin Login:** http://localhost:3000/admin/login.html
- **Public Website:** http://localhost:3000/

**Login Credentials:**
- Username: `admin`
- Password: `admin123`

---

## 📝 First Article (5 Minutes)

1. **Login** to http://localhost:3000/admin/login.html
2. Click **"+ New Article"** button
3. Fill in:
   - **Title** ← Your headline
   - **Category** ← Choose (Politics, World, Business, etc.)
   - **Author** ← Your name
   - **Description** ← Brief summary
   - **Content** ← Full article text
   - **Featured Image** ← Upload a photo
   - **Status** ← Select "Published"
4. Click **"Save Article"**
5. Visit http://localhost:3000/ to see it live!

---

## 📁 What's Included

```
Galmudug times/
├── 📄 PUBLIC WEBSITE
│   ├── index.html (home page)
│   ├── politics.html, world.html, business.html, etc.
│   └── styles.css (design)
│
├── 🔐 ADMIN CMS
│   ├── admin/login.html (login page)
│   └── admin/dashboard.html (manage articles)
│
├── 🖥️ BACKEND SERVER
│   ├── api/server.js (Express backend)
│   ├── api/package.json (dependencies)
│   └── api/.env (configuration)
│
├── 📊 DATABASE (auto-created)
│   └── data/articles.db (SQLite)
│
├── 📸 UPLOADS (auto-created)
│   └── uploads/ (article images stored here)
│
└── 📚 DOCUMENTATION
    ├── CMS-SETUP-GUIDE.md (installation help)
    ├── SYSTEM-OVERVIEW.md (how it works)
    └── README.md (original design guide)
```

---

## ✨ Features

### Admin Dashboard
- ✅ Create articles (title, content, images, date)
- ✅ Edit articles (modify after publishing)
- ✅ Delete articles (remove from website)
- ✅ Upload images (drag & drop support)
- ✅ Select categories (Politics, World, Business, Tech, Opinion, Culture)
- ✅ Draft/Publish status (control when articles go live)
- ✅ Statistics (total articles, published count, views)

### Public Website
- ✅ Home page with latest articles
- ✅ Category pages (Politics, World, Business, etc.)
- ✅ Full article pages with images
- ✅ Professional design with color-coded categories
- ✅ Responsive (works on phone, tablet, desktop)

### Security
- ✅ Secure login with encrypted passwords
- ✅ JWT authentication tokens
- ✅ Only published articles shown to public
- ✅ Admin-only access to create/edit/delete

---

## 🎨 Categories (Auto-Created)

| Category | Color | Slug |
|----------|-------|------|
| Politics | 🔴 Red | `politics` |
| World | 🔵 Blue | `world` |
| Business | 🟢 Green | `business` |
| Technology | 🟣 Purple | `technology` |
| Opinion | 🟡 Gold | `opinion` |
| Life & Culture | 🟠 Coral | `culture` |
| Analysis | ⚫ Dark Gray | `analysis` |

---

## 🔧 Troubleshooting

### "npm: command not found"
→ Install Node.js from https://nodejs.org

### "Port 3000 already in use"
→ Edit `api/.env` and change PORT to 3001

### "Server crashes on startup"
→ Delete `data/articles.db` and restart

### "Admin login not working"
→ Ensure server is running (check PowerShell window)

More help in **CMS-SETUP-GUIDE.md**

---

## 🌐 How It Works

```
You Write Article in Admin
         ↓
    [SAVE]
         ↓
   Stored in Database
         ↓
   Website Displays It
         ↓
   Readers View It
```

---

## 📚 Files Explained

| File | Purpose |
|------|---------|
| `api/server.js` | Backend that handles everything |
| `admin/dashboard.html` | Where you manage articles |
| `admin/login.html` | Secure login page |
| `index.html` | Website home page |
| `politics.html`, etc. | Category section pages |
| `styles.css` | Website design |
| `data/articles.db` | Where articles are stored |
| `uploads/` | Where images are saved |

---

## 🎯 Common Tasks

### Change Admin Password
Edit `api/server.js` (search for `admin123`) and restart server

### Add New Category
Edit `api/server.js` and add to the categories array, then restart

### Upload Larger Images
Edit file size limit in `api/server.js` line with `multer.diskStorage`

### Change Website Colors
Edit `styles.css` to customize color scheme

---

## 🚀 Next Steps

1. **Keep the server running** in PowerShell
2. **Visit** http://localhost:3000/admin/login.html
3. **Login** with admin / admin123
4. **Click** "+ New Article"
5. **Fill in** article details
6. **Click** "Save Article"
7. **Visit** http://localhost:3000/ to see it published!

---

## 💾 Default Test User

**Important:** This is for testing only!

- **Username:** admin
- **Password:** admin123

**Change these in production!**

---

## ❓ Need Help?

- **Setup Issues?** → See `CMS-SETUP-GUIDE.md`
- **How It Works?** → See `SYSTEM-OVERVIEW.md`
- **Want to Customize?** → See `README.md` (design guide)

---

## 🎬 You're Ready!

Everything is set up and ready to use. Just:

1. Open PowerShell
2. Type: `cd api && npm install && npm start`
3. Wait for: "Server running on http://localhost:3000"
4. Open browser to: http://localhost:3000/admin/login.html
5. Login with: admin / admin123

**Happy Publishing! 🎉**

---

**Created:** March 2026  
**Status:** Ready to Use ✅
