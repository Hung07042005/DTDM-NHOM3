import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel
from typing import List

from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv

# =======================
# Load .env
load_dotenv()

app = FastAPI()

# =======================
# Session
app.add_middleware(SessionMiddleware, secret_key="SECRET_KEY")

# =======================
# CORS (frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =======================
# OAuth setup
oauth = OAuth()

# GitHub
oauth.register(
    name='github',
    client_id=os.getenv("GITHUB_CLIENT_ID"),
    client_secret=os.getenv("GITHUB_CLIENT_SECRET"),
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize',
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'},
)

# Google
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)

# =======================
# In-memory storage
tasks = []


class Task(BaseModel):
    title: str

# =======================
# Auth APIs


@app.get("/login/github")
async def login_github(request: Request):
    redirect_uri = "http://localhost:8000/auth/github/callback"
    return await oauth.github.authorize_redirect(request, redirect_uri)


@app.get("/auth/github/callback")
async def auth_github(request: Request):
    token = await oauth.github.authorize_access_token(request)
    user = await oauth.github.get('user', token=token)

    # Save user
    request.session['user'] = user.json()

    # Redirect frontend
    return RedirectResponse("http://localhost:5500/frontend/src/Home.html")


@app.get("/login/google")
async def login_google(request: Request):
    redirect_uri = "http://localhost:8000/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/auth/google/callback")
async def auth_google(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user = token.get("userinfo")

    # Save user
    request.session['user'] = user

    # Redirect frontend
    return RedirectResponse("http://localhost:5500/frontend/src/Home.html")


@app.get("/me")
def get_me(request: Request):
    user = request.session.get("user")
    if user:
        return user
    return {"message": "Not logged in"}


@app.get("/logout")
def logout(request: Request):
    request.session.clear()
    return {"message": "Logged out"}

# =======================
# Task APIs (Protected)


@app.get("/tasks", response_model=List[str])
def get_tasks(request: Request):
    if not request.session.get("user"):
        return []
    return tasks


@app.post("/tasks")
def add_task(task: Task, request: Request):
    if not request.session.get("user"):
        return {"error": "Not logged in"}

    tasks.append(task.title)
    return {"message": "Task added successfully", "task": task.title}


# =======================
# Run server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
