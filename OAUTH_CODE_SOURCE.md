# 🔐 OAUTH IMPLEMENTATION - MÃ SOURCE CODE

## **1. GITHUB OAUTH FLOW**

### **Backend Endpoint 1: GET /login/github**

**Mã Python:**
```python
@app.get("/login/github")
async def login_github(request: Request):
    """Redirect to GitHub OAuth authorization endpoint"""
    github_client_id = os.getenv("GITHUB_CLIENT_ID")
    redirect_uri = "http://localhost:8000/auth/github/callback"

    params = {
        "client_id": github_client_id,
        "redirect_uri": redirect_uri,
        "scope": "user:email",
        "state": "github_oauth",
    }

    auth_url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    return RedirectResponse(url=auth_url)
```

**Flow:**
1. Frontend gọi: `window.location.href = 'http://localhost:8000/login/github'`
2. Backend redirect về GitHub OAuth page
3. User đăng nhập GitHub
4. GitHub redirect về `/auth/github/callback?code=...`

---

### **Backend Endpoint 2: GET /auth/github/callback**

**Mã Python:**
```python
@app.get("/auth/github/callback")
async def github_callback(code: str = None, state: str = None):
    """Handle GitHub OAuth callback"""
    if not code:
        raise HTTPException(status_code=400, detail="No authorization code provided")

    try:
        github_client_id = os.getenv("GITHUB_CLIENT_ID")
        github_client_secret = os.getenv("GITHUB_CLIENT_SECRET")

        # Step 1: Exchange code for access token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                json={
                    "client_id": github_client_id,
                    "client_secret": github_client_secret,
                    "code": code,
                },
                headers={"Accept": "application/json"}
            )
            token_data = token_response.json()

            if "error" in token_data:
                raise HTTPException(status_code=400, detail=token_data.get("error_description", "Token exchange failed"))

            access_token = token_data.get("access_token")

            # Step 2: Get user info from GitHub API
            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            github_user = user_response.json()

            # Step 3: Get email if not in main response
            email = github_user.get("email")
            if not email:
                email_response = await client.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                emails = email_response.json()
                primary_email = next(
                    (e["email"] for e in emails if e.get("primary")), None)
                if primary_email:
                    email = primary_email

            if not email:
                raise HTTPException(status_code=400, detail="Could not retrieve email from GitHub")

        # Step 4: Create or update user in database
        db: Session = SessionLocal()
        try:
            user_email = email.lower()
            db_user = db.query(User).filter(User.email == user_email).first()

            if not db_user:
                # Create new user
                user_name = github_user.get("name") or github_user.get("login", "GitHub User")
                db_user = User(
                    email=user_email,
                    full_name=user_name,
                    role="User",
                    status="Active",
                    password_hash=hash_password(f"oauth_github_{github_user.get('id')}"),
                )
                db.add(db_user)
                db.commit()
                db.refresh(db_user)
        finally:
            db.close()

        # Step 5: Redirect to frontend with user info
        user_data = json.dumps(user_to_dict(db_user))
        escaped_user_data = urlencode({"user": user_data})
        return RedirectResponse(url=f"http://localhost:5500/src/auth-callback.html?{escaped_user_data}&provider=github")

    except Exception as e:
        error_msg = urlencode({"error": str(e)})
        return RedirectResponse(url=f"http://localhost:5500/src/auth-callback.html?{error_msg}")
```

---

## **2. GOOGLE OAUTH FLOW**

### **Backend Endpoint 3: GET /login/google**

**Mã Python:**
```python
@app.get("/login/google")
async def login_google(request: Request):
    """Redirect to Google OAuth authorization endpoint"""
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = "http://localhost:8000/auth/google/callback"

    params = {
        "client_id": google_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid profile email",
        "access_type": "offline",
        "state": "google_oauth",
    }

    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url=auth_url)
```

**Flow:**
1. Frontend gọi: `window.location.href = 'http://localhost:8000/login/google'`
2. Backend redirect về Google OAuth page
3. User đăng nhập Google
4. Google redirect về `/auth/google/callback?code=...`

---

### **Backend Endpoint 4: GET /auth/google/callback**

**Mã Python:**
```python
@app.get("/auth/google/callback")
async def google_callback(code: str = None, state: str = None, error: str = None):
    """Handle Google OAuth callback"""
    if error:
        raise HTTPException(status_code=400, detail=f"Google OAuth error: {error}")

    if not code:
        raise HTTPException(status_code=400, detail="No authorization code provided")

    try:
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        redirect_uri = "http://localhost:8000/auth/google/callback"

        # Step 1: Exchange code for access token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                json={
                    "client_id": google_client_id,
                    "client_secret": google_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                }
            )
            token_data = token_response.json()

            if "error" in token_data:
                raise HTTPException(status_code=400, detail=token_data.get("error", "Token exchange failed"))

            access_token = token_data.get("access_token")

            # Step 2: Get user info from Google API
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            google_user = user_response.json()

            if "error" in google_user:
                raise HTTPException(status_code=400, detail="Failed to get user info from Google")

            email = google_user.get("email")
            if not email:
                raise HTTPException(status_code=400, detail="Could not retrieve email from Google")

        # Step 3: Create or update user in database
        db: Session = SessionLocal()
        try:
            user_email = email.lower()
            db_user = db.query(User).filter(User.email == user_email).first()

            if not db_user:
                # Create new user
                user_name = google_user.get("name", "Google User")
                db_user = User(
                    email=user_email,
                    full_name=user_name,
                    role="User",
                    status="Active",
                    password_hash=hash_password(f"oauth_google_{google_user.get('id')}"),
                )
                db.add(db_user)
                db.commit()
                db.refresh(db_user)
        finally:
            db.close()

        # Step 4: Redirect to frontend with user info
        user_data = json.dumps(user_to_dict(db_user))
        escaped_user_data = urlencode({"user": user_data})
        return RedirectResponse(url=f"http://localhost:5500/src/auth-callback.html?{escaped_user_data}&provider=google")

    except Exception as e:
        error_msg = urlencode({"error": str(e)})
        return RedirectResponse(url=f"http://localhost:5500/src/auth-callback.html?{error_msg}")
```

---

## **3. FRONTEND OAUTH HANDLER**

### **HTML: auth-callback.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authenticating...</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'DM Sans', sans-serif;
            background: #0f1623;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
        }

        .auth-loader {
            text-align: center;
            color: white;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top: 3px solid #4eb5f7;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="auth-loader">
        <div class="spinner"></div>
        <p>Completing authentication...</p>
    </div>

    <script>
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const userParam = urlParams.get('user');
        const provider = urlParams.get('provider');
        const error = urlParams.get('error');

        if (error) {
            // Handle error
            alert(`Authentication failed: ${decodeURIComponent(error)}`);
            window.location.href = 'index.html';
        } else if (userParam) {
            try {
                // Decode and parse user data
                const user = JSON.parse(decodeURIComponent(userParam));

                // Save to localStorage
                localStorage.setItem('taskflow-user', JSON.stringify(user));

                // Log successful login
                console.log(`Successfully authenticated with ${provider}:`, user);

                // Redirect to home page
                setTimeout(() => {
                    window.location.href = 'Home.html';
                }, 500);
            } catch (e) {
                console.error('Failed to parse user data:', e);
                alert('Authentication error: Failed to process user data');
                window.location.href = 'index.html';
            }
        } else {
            // No user data or error
            console.error('No authentication data received');
            window.location.href = 'index.html';
        }
    </script>
</body>
</html>
```

---

### **JavaScript: Frontend Social Login (index.js)**

```javascript
function socialLogin(provider) {
    if (provider === 'Google') {
        window.location.href = 'http://localhost:8000/login/google';
    }
    if (provider === 'GitHub') {
        window.location.href = 'http://localhost:8000/login/github';
    }
}
```

---

## **4. HELPER FUNCTIONS (Backend)**

### **Password Hashing**

```python
import hashlib

def hash_password(password: str):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def verify_password(password: str, password_hash: str):
    """Verify password against hash"""
    return hash_password(password) == password_hash
```

### **User Data Conversion**

```python
def user_to_dict(user: User):
    """Convert User object to dictionary"""
    return {
        "id": user.id,
        "name": user.full_name or "",
        "email": user.email,
        "role": user.role,
        "status": user.status,
    }
```

---

## **5. DATABASE SCHEMA (User Table)**

```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, unique=True, index=True)
    full_name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="User")
    status = Column(String, nullable=False, default="Active")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, 
                        default=datetime.utcnow, onupdate=datetime.utcnow)
```

---

## **6. ENVIRONMENT CONFIG (.env)**

```env
# GitHub OAuth Credentials
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database
DATABASE_URL=sqlite:///./data/todo.db
```

---

## **7. REQUIREMENTS.TXT**

```
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.2
sqlalchemy==2.0.23
authlib==1.3.0
python-dotenv==1.0.0
httpx==0.25.2
```

---─────────────────────────────────┐
│ 6. BACKEND: /auth/github/callback ENDPOINT                  │
│    - Receive authorization code                             │
│    - Exchange code for access token (GitHub API)            │
│    - Fetch user info using access token                     │
│    - Extract email and user details                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. DATABASE OPERATIONS                            

## **8. COMPLETE FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "LOGIN WITH GITHUB/GOOGLE"                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. FRONTEND → window.location.href = 'http://localhost:8000/login/github'
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. BACKEND: /login/github ENDPOINT                          │
│    - Create auth URL with client_id, redirect_uri, scope    │
│    - Redirect to GitHub OAuth Authorization URL             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. GITHUB OAUTH PAGE                                        │
│    - User logs in with GitHub credentials                   │
│    - User confirms app permissions                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. GITHUB REDIRECTS TO BACKEND CALLBACK                     │
│    GET /auth/github/callback?code=xxx&state=xxx             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────          │
│    - Check if user exists (by email)                        │
│    - If YES: Update last login time                         │
│    - If NO: Create new user                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. BACKEND REDIRECTS TO FRONTEND CALLBACK                   │
│    /src/auth-callback.html?user={JSON}&provider=github      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. FRONTEND: auth-callback.html                             │
│    - Parse URL parameters                                   │
│    - Save user data to localStorage                         │
│    - Redirect to Home.html                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ✅ 10. SUCCESS - USER LOGGED IN                             │
│    Home page displays with authenticated user               │
└─────────────────────────────────────────────────────────────┘
```

---

## **9. ERROR HANDLING**

### **Common Errors & Solutions**

```python
# Error 1: Missing authorization code
if not code:
    raise HTTPException(status_code=400, detail="No authorization code provided")

# Error 2: Token exchange failed
if "error" in token_data:
    raise HTTPException(status_code=400, detail=token_data.get("error_description"))

# Error 3: No email from OAuth provider
if not email:
    raise HTTPException(status_code=400, detail="Could not retrieve email from GitHub/Google")

# Error 4: Failed to get user info
if "error" in user_response:
    raise HTTPException(status_code=400, detail="Failed to get user info")
```

---

## **10. TESTING OAUTH ENDPOINTS**

### **Test GitHub Login**

```bash
# 1. Access GitHub login endpoint
http://localhost:8000/login/github

# 2. You'll be redirected to GitHub
# 3. Log in with your GitHub account
# 4. Authorize the app
# 5. You'll be redirected to auth-callback.html
# 6. Then redirected to Home.html (if successful)
```

### **Test Google Login**

```bash
# 1. Access Google login endpoint
http://localhost:8000/login/google

# 2. You'll be redirected to Google
# 3. Log in with your Google account  
# 4. Authorize the app
# 5. You'll be redirected to auth-callback.html
# 6. Then redirected to Home.html (if successful)
```

---

## **📦 Dependencies Used**

- **fastapi** - Web framework
- **httpx** - Async HTTP client (for API calls)
- **python-dotenv** - Load environment variables
- **sqlalchemy** - ORM for database
- **authlib** - OAuth library (optional alternative)
- **uvicorn** - ASGI server

---

**Last Updated:** 2026-03-31  
**Status:** Production Ready
