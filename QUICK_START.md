# 🚀 QUICK START GUIDE (TÓM TẮT NHANH)

## **⏱️ 2 PHÚT ĐỂ CHẠY CHƯƠNG TRÌNH**

### **Bước 1: Cài Dependencies (Lần Đầu)**

```powershell
# Terminal 1: Backend
cd e:\DTDM-NHOM3\backend
pip install -r requirements.txt

# Terminal 2: Frontend  
cd e:\DTDM-NHOM3\frontend
npm install
```

### **Bước 2: Tạo .env File**

Tạo file `backend/.env` với credentials của bạn:

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DATABASE_URL=sqlite:///./data/todo.db
```

### **Bước 3: Chạy Backend**

```powershell
cd e:\DTDM-NHOM3\backend
python main.py
```

**Kết quả:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### **Bước 4: Chạy Frontend (Terminal Mới)**

```powershell
cd e:\DTDM-NHOM3\frontend
npm run dev
```

**Kết quả:**
```
VITE v7.3.1  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### **Bước 5: Truy Cập Ứng Dụng**

Mở browser:
```
http://localhost:5173/
```

✅ **XONG! Chương trình đã chạy**

---

## **🧪 TEST OAUTH LOGIN**

### **Test GitHub Login:**
1. Click "Login with GitHub"
2. Đăng nhập GitHub
3. Chấp nhận permissions
4. ✅ Redirect về Home.html

### **Test Google Login:**
1. Click "Login with Google" 
2. Đăng nhập Google
3. Chấp nhận permissions
4. ✅ Redirect về Home.html

---

## **📊 API ENDPOINTS**

| Endpoint | Method | Mô Tả |
|----------|--------|-------|
| `/login/github` | GET | Redirect to GitHub OAuth |
| `/auth/github/callback` | GET | Handle GitHub callback |
| `/login/google` | GET | Redirect to Google OAuth |
| `/auth/google/callback` | GET | Handle Google callback |
| `/api/tasks` | GET | Lấy tất cả tasks |
| `/api/tasks` | POST | Tạo task mới |
| `/api/tasks/{id}` | PUT | Update task |
| `/api/tasks/{id}` | DELETE | Xóa task |
| `/api/task-lists` | GET/POST | Manage task lists |
| `/api/tags` | GET/POST | Manage tags |
| `/api/users` | GET/POST | Manage users |

---

## **🔍 KIỂM TRA DATABASE**

```powershell
# Xem database
cd e:\DTDM-NHOM3\backend\data
sqlite3 todo.db

# Xem users
SELECT * FROM users;

# Reset database
Remove-Item e:\DTDM-NHOM3\backend\data\todo.db
```

---

## **🛠️ SWAGGER DOCS**

Xem tất cả API endpoints:
```
http://localhost:8000/docs
```

---

## **📁 FILE STRUCTURE**

```
DTDM-NHOM3/
├── backend/
│   ├── main.py (Backend code)
│   ├── requirements.txt (Python packages)
│   ├── .env (Credentials - TẠO FILE NÀY)
│   └── data/
│       └── todo.db (Database - Auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── index.html (Login page)
│   │   ├── Home.html (Main app)
│   │   ├── auth-callback.html (OAuth callback handler)
│   │   ├── scripts/
│   │   └── styles/
│   ├── package.json (npm packages)
│   └── vite.config.js
│
└── Documentation/
    ├── HUONG_DAN_CHAY_CHUONG_TRINH.md (Hướng dẫn chi tiết)
    ├── HAY_CHAY_LEH_CODE.md (Mã lệnh sẵn sàng copy-paste)
    ├── OAUTH_CODE_SOURCE.md (Mã source OAuth)
    └── QUICK_START.md (File này)
```

---

## **❌ LỖI THƯỜNG GẶP & CÁC CÁCH KHẮC PHỤC**

| Lỗi | Giải Pháp |
|-----|----------|
| `ModuleNotFoundError: fastapi` | `pip install -r requirements.txt` |
| Port 8000 đang dùng | `netstat -ano \| findstr :8000` → `taskkill /PID xxx /F` |
| OAuth callback error | Kiểm tra .env file & credentials |
| Database locked | `Remove-Item backend\data\todo.db` |
| Frontend không kết nối backend | Kiểm tra backend chạy trên port 8000 |

---

## **⚡ THÔNG TIN QUAN TRỌNG**

✅ **Đã cấu hình:**
- OAuth GitHub & Google
- CORS (Cross-Origin)
- Database (SQLite)
- API Documentation (Swagger)

✅ **Credentials đã có:**
- GitHub OAuth credentials
- Google OAuth credentials

⚠️ **Cần tạo:**
- `backend/.env` file (từ template trên)

---

## **📞 CẦN GIÚP?**

1. **Hướng dẫn chi tiết:** Xem `HUONG_DAN_CHAY_CHUONG_TRINH.md`
2. **Mã lệnh copy-paste:** Xem `HAY_CHAY_LEH_CODE.md`
3. **Mã source OAuth:** Xem `OAUTH_CODE_SOURCE.md`
4. **API Documentation:** Truy cập `http://localhost:8000/docs`

---

**Status:** ✅ Ready to Run  
**Last Updated:** 2026-03-31
