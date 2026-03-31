# 📋 PROJECT OVERVIEW & CHECKLIST

## **📌 TÓM TẮT PROJECT**

### **Tên Project:** DTDM-NHOM3 (Task Management với OAuth)
### **Stack:**
- **Backend:** Python FastAPI + SQLite
- **Frontend:** JavaScript Vite + HTML/CSS
- **OAuth:** GitHub & Google
- **Database:** SQLite

---

## **🏗️ ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (http://localhost:5173)                            │
│ ├── Login Page (index.html)                                │
│ ├── Home Page (Home.html)                                  │
│ ├── OAuth Callback (auth-callback.html)                    │
│ └── Admin Panel (admin.html)                               │
└─────────────────────────────────────────────────────────────┘
                            ↕ (API Calls)
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (http://localhost:8000)                            │
│ ├── OAuth Endpoints (/login/*, /auth/*/callback)          │
│ ├── Task API (/api/tasks/*)                               │
│ ├── Task List API (/api/task-lists/*)                     │
│ ├── Tag API (/api/tags/*)                                 │
│ ├── User API (/api/users/*)                               │
│ └── Database (SQLite: todo.db)                            │
└─────────────────────────────────────────────────────────────┘
                            ↕ (OAuth Redirect)
┌─────────────────────────────────────────────────────────────┐
│ EXTERNAL AUTH PROVIDERS                                    │
│ ├── GitHub OAuth (github.com/login/oauth/authorize)      │
│ └── Google OAuth (accounts.google.com/o/oauth2/v2/auth)  │
└─────────────────────────────────────────────────────────────┘
```

---

## **📁 THÀNH PHẦN PROJECT**

### **Backend Files**

| File | Mục Đích | Trạng Thái |
|------|---------|----------|
| `main.py` | API Server + OAuth | ✅ Hoàn thành |
| `schemas.py` | Data Models | ✅ Hoàn thành |
| `requirements.txt` | Python dependencies | ✅ Hoàn thành |
| `.env` | Environment variables | ❌ **CẦN TẠO** |
| `Dockerfile` | Docker config | ✅ Có |
| `data/todo.db` | SQLite Database | 🔄 Auto-created |

### **Frontend Files**

| File | Mục Đích | Trạng Thái |
|------|---------|----------|
| `index.html` | Login page | ✅ Hoàn thành |
| `Home.html` | Main app page | ✅ Hoàn thành |
| `admin.html` | Admin panel | ✅ Hoàn thành |
| `auth-callback.html` | OAuth callback handler | ✅ Hoàn thành |
| `scripts/index.js` | Login logic | ✅ Hoàn thành |
| `scripts/Home.js` | App logic | ✅ Hoàn thành |
| `scripts/admin.js` | Admin logic | ✅ Hoàn thành |
| `package.json` | npm dependencies | ✅ Hoàn thành |
| `vite.config.js` | Vite config | ✅ Hoàn thành |

### **Configuration Files**

| File | Mục Đích | Trạng Thái |
|------|---------|----------|
| `docker-compose.yml` | Docker orchestration | ✅ Có |
| `.env` | Environment variables | ❌ **CẦN TẠO** |
| `QUICK_START.md` | Quick start guide | ✅ Tạo mới |
| `HUONG_DAN_CHAY_CHUONG_TRINH.md` | Chi tiết guide | ✅ Tạo mới |
| `HAY_CHAY_LEH_CODE.md` | Copy-paste code | ✅ Tạo mới |
| `OAUTH_CODE_SOURCE.md` | OAuth source code | ✅ Tạo mới |

---

## **✅ CHECKLIST: CÓ SẴN NHỮNG GÌ?**

### **Backend**
- [x] FastAPI server
- [x] SQLAlchemy ORM
- [x] User model & table
- [x] Task model & table
- [x] TaskList model & table
- [x] Tag model & table
- [x] OAuth GitHub endpoint
- [x] OAuth Google endpoint
- [x] GitHub callback handler
- [x] Google callback handler
- [x] Database creation logic
- [x] Password hashing
- [ ] .env file (CẦN TẠO)

### **Frontend**
- [x] Login page (HTML + CSS + JS)
- [x] Home page (HTML + CSS + JS)
- [x] OAuth callback page
- [x] Admin panel
- [x] API request helper
- [x] Social login buttons
- [x] localStorage integration
- [x] Responsive design

### **OAuth Setup**
- [x] GitHub credentials
- [x] Google credentials
- [ ] .env file (CẦN TẠO)

### **Infrastructure**
- [x] Docker setup
- [x] Docker Compose
- [x] CORS middleware
- [x] Error handling
- [x] Request validation

---

## **🔧 CẦN CHUẨN BỊ**

### **1️⃣ CẠI ĐẶT TRÊN MÁY**

```powershell
# Kiểm tra Python
python --version    # Phải >= 3.8

# Kiểm tra Node.js
node --version      # Phải >= 14
npm --version
```

### **2️⃣ TẠO FILE .env**

```powershell
# Tạo file backend/.env
cd e:\DTDM-NHOM3\backend

# Thêm nội dung này (với credentials của bạn)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DATABASE_URL=sqlite:///./data/todo.db
```

### **3️⃣ CÀI DEPENDENCIES**

```powershell
# Backend
cd e:\DTDM-NHOM3\backend
pip install -r requirements.txt

# Frontend
cd e:\DTDM-NHOM3\frontend
npm install
```

### **4️⃣ CHẠY SERVERS**

```powershell
# Terminal 1: Backend
cd e:\DTDM-NHOM3\backend
python main.py

# Terminal 2: Frontend
cd e:\DTDM-NHOM3\frontend
npm run dev
```

---

## **🎯 EXPECTED RESULTS**

### **Backend Output**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Started server process [XXXX]
INFO:     Application startup complete.
```

### **Frontend Output**
```
VITE v7.3.1  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### **Browser Access**
```
Frontend:  http://localhost:5173
Backend:   http://localhost:8000
API Docs:  http://localhost:8000/docs
```

---

## **📊 DATABASE SCHEMA**

### **Users Table**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR,
    password_hash VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'User',
    status VARCHAR DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Tasks Table**
```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER FOREIGN KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR DEFAULT 'todo',
    priority INTEGER DEFAULT 2,
    due_date DATETIME,
    tags TEXT,
    completed BOOLEAN DEFAULT 0,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **TaskLists Table**
```sql
CREATE TABLE task_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER FOREIGN KEY NOT NULL,
    name VARCHAR NOT NULL,
    color VARCHAR,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Tags Table**
```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER FOREIGN KEY NOT NULL,
    name VARCHAR NOT NULL,
    color VARCHAR,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## **🔐 OAUTH FLOW SUMMARY**

### **GitHub**
```
User clicks "Login with GitHub"
    ↓
Frontend → /login/github
    ↓
Backend redirects to GitHub OAuth
    ↓
User logs in GitHub + authorizes
    ↓
GitHub redirects to /auth/github/callback?code=...
    ↓
Backend exchanges code for access token
    ↓
Backend fetches user info from GitHub API
    ↓
Backend creates/updates user in database
    ↓
Backend redirects to auth-callback.html with user data
    ↓
Frontend saves to localStorage & redirects to Home.html
    ↓
✅ User logged in!
```

### **Google**
```
User clicks "Login with Google"
    ↓
Frontend → /login/google
    ↓
Backend redirects to Google OAuth
    ↓
User logs in Google + authorizes
    ↓
Google redirects to /auth/google/callback?code=...
    ↓
Backend exchanges code for access token
    ↓
Backend fetches user info from Google API
    ↓
Backend creates/updates user in database
    ↓
Backend redirects to auth-callback.html with user data
    ↓
Frontend saves to localStorage & redirects to Home.html
    ↓
✅ User logged in!
```

---

## **🚀 START COMMANDS (COPY-PASTE)**

### **Backend**
```powershell
cd e:\DTDM-NHOM3\backend && python main.py
```

### **Frontend**
```powershell
cd e:\DTDM-NHOM3\frontend && npm run dev
```

### **Both (Sequential)**
```powershell
cd e:\DTDM-NHOM3\backend && python main.py && cd ..\frontend && npm run dev
```

---

## **📚 DOCUMENTATION FILES**

| File | Nội Dung |
|------|---------|
| `QUICK_START.md` | ⚡ 2 phút để chạy |
| `HUONG_DAN_CHAY_CHUONG_TRINH.md` | 📖 Hướng dẫn chi tiết 12 phần |
| `HAY_CHAY_LEH_CODE.md` | 💻 Mã lệnh & endpoints |
| `OAUTH_CODE_SOURCE.md` | 🔐 Mã source OAuth |
| `OAUTH_IMPLEMENTATION.md` | 📋 Mô tả implementation |
| `OAUTH_SETUP.md` | 🔧 Setup procedures |

---

## **🔍 QUICK LINKS**

```
Frontend:      http://localhost:5173
Backend:       http://localhost:8000
API Docs:      http://localhost:8000/docs
Database:      backend/data/todo.db (SQLite)
Config:        backend/.env (CREATE THIS)
```

---

## **⚠️ IMPORTANT NOTES**

1. **Luôn tạo .env file** trước khi chạy backend
2. **Chạy 2 terminals riêng** cho backend & frontend
3. **Kiểm tra ports:** 8000 (backend), 5173 (frontend)
4. **Database tự động tạo** khi backend start lần đầu
5. **OAuth credentials đã có** trong document này

---

## **🆘 TROUBLESHOOTING**

| Problem | Solution |
|---------|----------|
| Python module not found | `pip install -r requirements.txt` |
| Port already in use | Kill process or use different port |
| OAuth redirect error | Check .env credentials |
| Database locked | Delete `backend/data/todo.db` |
| CORS error | Backend has CORS enabled |

---

## **📞 SUPPORT**

Nếu bạn gặp vấn đề:

1. Kiểm tra **QUICK_START.md**
2. Kiểm tra **HUONG_DAN_CHAY_CHUONG_TRINH.md** (Phần Troubleshooting)
3. Kiểm tra logs từ backend & frontend
4. Access **http://localhost:8000/docs** để test API

---

**Project Status:** ✅ **READY TO RUN**  
**Setup Required:** 🔧 Create `backend/.env` file  
**Last Updated:** 2026-03-31

---

## **NEXT STEPS**

1. ✅ Tạo `backend/.env` file
2. ✅ Cài pip & npm dependencies
3. ✅ Chạy backend: `python main.py`
4. ✅ Chạy frontend: `npm run dev`
5. ✅ Test OAuth login
6. ✅ Deploy (Docker) - Tùy chọn

---

**Hãy bắt đầu từ QUICK_START.md!** 🚀
