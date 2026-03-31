# OAuth GitHub & Google Login - Implementation Summary

## Vấn đề Gốc
- Backend **không có endpoints** `/login/github` và `/login/google`
- Backend **không có thư viện OAuth** (authlib, httpx, etc.)
- Frontend **không có trang callback handler** để xử lý OAuth response

## Giải Pháp Triển Khai

### 1. Backend Update (main.py)

**Thêm imports:**
```python
import httpx
import json
from urllib.parse import urlencode
from dotenv import load_dotenv

load_dotenv()
```

**Thêm 4 endpoints mới:**

#### GET `/login/github`
- Redirect user đến GitHub OAuth authorization page
- Gọi GitHub endpoint: `https://github.com/login/oauth/authorize`
- Params: client_id, redirect_uri, scope, state

#### GET `/auth/github/callback`
- GitHub redirect về đây sau khi user đăng nhập
- Exchange authorization code → access token
- Fetch user info từ GitHub API
- Lấy email từ GitHub user emails endpoint (nếu không có ở main response)
- Create/update user trong database
- Redirect về frontend auth-callback.html với user data

#### GET `/login/google`
- Redirect user đến Google OAuth authorization page
- Endpoint: `https://accounts.google.com/o/oauth2/v2/auth`
- Params: client_id, redirect_uri, response_type, scope, access_type

#### GET `/auth/google/callback`
- Google redirect về đây sau khi user đăng nhập
- Exchange authorization code → access token
- Fetch user info từ Google API
- Create/update user trong database
- Redirect về frontend auth-callback.html với user data

**User Creation Logic:**
- Query existing user by email
- Nếu có → cập nhật updated_at, return user
- Nếu không → tạo user mới với:
  - email (from OAuth provider)
  - full_name (from OAuth provider)
  - password_hash (generated từ oauth_{provider}_{id})
  - role = "User"
  - status = "Active"

### 2. Dependencies (requirements.txt)

Thêm:
- `authlib==1.3.0` - OAuth/OpenID Connect library
- `python-dotenv==1.0.0` - Load .env environment variables
- `httpx==0.25.2` - Async HTTP client

### 3. Frontend Update

**Tạo auth-callback.html:**
- Trang nhỏ được redirect đến sau OAuth callback
- Parse URL params: user, provider, error
- Save user data to localStorage
- Redirect to Home.html on success
- Show error message on failure

**Frontend socialLogin() function (index.js):**
- Đã có sẵn ✓
- Gọi `/login/github` hoặc `/login/google` correctly

## Configuration Requirements

### .env file (backend/.env)
```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### GitHub OAuth App Settings
- Authorization callback URL: `http://localhost:8000/auth/github/callback`
- Scopes: user:email (để access user emails)

### Google OAuth Settings
- Authorized redirect URIs: `http://localhost:8000/auth/google/callback`
- Scopes: openid profile email
- Application type: Web application

## Flow Diagram

```
1. User clicks "Login with GitHub/Google" button
   ↓
2. Frontend → window.location.href = 'http://localhost:8000/login/{provider}'
   ↓
3. Backend endpoint /login/{provider} returns redirect to OAuth provider
   ↓
4. User logs into GitHub/Google
   ↓
5. OAuth provider redirects to /auth/{provider}/callback?code=...
   ↓
6. Backend exchanges code for access token
   ↓
7. Backend fetches user info from OAuth provider
   ↓
8. Backend creates/updates user in database
   ↓
9. Backend redirects to /src/auth-callback.html?user=...&provider=...
   ↓
10. Frontend auth-callback.html:
    - Parses URL params
    - Saves user to localStorage
    - Redirects to Home.html
   ↓
11. App loads with authenticated user
```

## Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| Invalid callback URL error | Ensure callback URI exactly matches OAuth app settings (case-sensitive, no trailing slash) |
| Email not retrieved from OAuth | Some accounts have private email; need proper scopes |
| localStorage not persisting | Check browser localStorage settings |
| CORS errors | Backend already has CORSMiddleware configured |
| Port conflicts | Update vite.config.js and backend redirect URLs if ports are in use |

## Testing Checklist

- [x] Backend starts without errors
- [ ] GitHub OAuth app configured with correct callback URL
- [ ] Google OAuth app configured with correct callback URL  
- [ ] Frontend can access /login/github endpoint
- [ ] Frontend can access /login/google endpoint
- [ ] GitHub login flow completes successfully
- [ ] Google login flow completes successfully
- [ ] User data saved to localStorage
- [ ] User redirected to Home.html after login
- [ ] Existing user login (email already in DB) works
- [ ] New user registration (email not in DB) works

## Next Steps

1. Configure GitHub OAuth app:
   - Go to https://github.com/settings/developers
   - Create/edit OAuth app
   - Set Authorization callback URL to `http://localhost:8000/auth/github/callback`
   - Copy Client ID and Secret to .env

2. Configure Google OAuth app:
   - Go to https://console.cloud.google.com/
   - Create credentials (OAuth 2.0 Web application)
   - Add redirect URI: `http://localhost:8000/auth/google/callback`
   - Copy Client ID and Secret to .env

3. Start backend: `python backend/main.py`

4. Start frontend: `npm run dev` or `npx vite`

5. Test login flows in browser

## Setup Credentials

1. Cập nhật file `backend/.env` với OAuth credentials của bạn:
```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

2. Đảm bảo Redirect URLs được cấu hình trong GitHub & Google OAuth app settings
