# OAuth GitHub & Google Setup Guide

## Vấn đề
OAuth đăng nhập vừa mới được triển khai. Để nó hoạt động, bạn cần cấu hình Redirect URLs trong GitHub và Google OAuth app settings.

## GitHub OAuth Setup

1. **Tạo GitHub OAuth App** (nếu chưa có):
   - Vào https://github.com/settings/developers
   - Click "New OAuth App"
   - Điền thông tin:
     - Application name: TaskFlow
   - Homepage URL: http://localhost:8080
   - Authorization callback URL: **http://localhost:8080/auth/github/callback** (QUAN TRỌNG!)

2. **Cập nhật .env file** ở `backend/.env`:
   ```
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```
   Copy Client ID và Client Secret từ GitHub app settings

## Google OAuth Setup

1. **Tạo Google OAuth Credentials** (nếu chưa có):
   - Vào https://console.cloud.google.com/
   - Tạo new project hoặc chọn existing
   - Vào "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Chọn "Web application"
   - Thêm Authorized redirect URIs:
       - **http://localhost:8080/auth/google/callback** (QUAN TRỌNG!)
       - http://localhost:8080 (optional, cho frontend)

2. **Cập nhật .env file** ở `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```
   Copy từ Google Cloud Console

## Testing Login Flow

1. **Start Backend**:
   ```bash
   cd ..
   docker compose up --build
   ```
   Ứng dụng sẽ chạy ở http://localhost:8080

2. **Test Login**:
   - Vào http://localhost:8080
   - Click "Continue with GitHub" hoặc "Continue with Google"
   - Bạn sẽ được redirect tới GitHub/Google login
   - Sau đăng nhập thành công, sẽ redirect về auth-callback.html
   - User data sẽ được lưu vào localStorage
   - Sẽ redirect tới Home.html

## Troubleshooting

**Error: "invalid_client" hoặc invalid redirect_uri**
- Kiểm tra callback URL configuration ở GitHub/Google app settings
- Đảm bảo match chính xác: `http://localhost:8080/auth/github/callback` (hoặc Google)
- Không có dấu `/` cuối, không đổi port.

**Error: "Email not found"**
- Tài khoản GitHub/Google có thể private email
- Cần phải có public email hoặc access token scopes đúng

**Localhost port issues**
- Nếu port 8080 bị chiếm, đổi mapping port trong `docker-compose.yml`

## Production Deployment

Khi deploy lên production, cần cập nhật:
1. Callback URLs ở GitHub/Google app settings:
   - `https://yourdomain.com/auth/github/callback`
   - `https://yourdomain.com/auth/google/callback`

2. Update frontend redirect URLs ở `backend/main.py` (search/replace localhost:5500)

3. Update frontend socialLogin() URLs ở `frontend/src/scripts/index.js` (từ localhost:8000 sang yourdomain.com)
