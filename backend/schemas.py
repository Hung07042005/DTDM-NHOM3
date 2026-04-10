from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ================= TASK =================

class TaskCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "todo"
    due_date: Optional[datetime] = None
    completed: Optional[bool] = False
    priority: Optional[int] = 2
    tags: List[str] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None
    priority: Optional[int] = None
    tags: Optional[List[str]] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    completed: bool
    description: Optional[str] = None
    status: str
    priority: int
    due_date: Optional[datetime] = None
    list_id: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ================= COMMENT =================

class TaskCommentCreate(BaseModel):
    content: Optional[str] = None
    user_id: Optional[int] = None


class TaskCommentResponse(BaseModel):
    id: int
    task_id: int
    user_id: Optional[int] = None
    user_name: str
    content: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskCommentsResponse(BaseModel):
    comments: List[TaskCommentResponse]


# ================= TASK LIST =================

class TaskListResponse(BaseModel):
    tasks: List[TaskResponse]


class TaskListCreate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class TaskListUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class TaskListItemResponse(BaseModel):
    id: int
    name: str
    color: Optional[str] = None

    class Config:
        from_attributes = True


class TaskListsResponse(BaseModel):
    task_lists: List[TaskListItemResponse]


# ================= TAG =================

class TagCreate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class TagResponse(BaseModel):
    id: int
    name: str
    color: Optional[str] = None

    class Config:
        from_attributes = True


class TagsResponse(BaseModel):
    tags: List[TagResponse]


# ================= USER =================

class UserCreate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = "User"
    status: Optional[str] = "Active"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str

    class Config:
        from_attributes = True


class UsersResponse(BaseModel):
    users: List[UserResponse]


# ================= AUTH =================

class AuthRegisterRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None


class AuthLoginRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None


class AuthResponse(BaseModel):
    message: str
    user: UserResponse
    access_token: str   # 🔥 THÊM DÒNG NÀY


# ================= OTHER =================

class ContainerResponse(BaseModel):
    container_id: str


class ErrorResponse(BaseModel):
    error: str
    message: str


# ================= PROJECT =================

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


# ================= ASSIGN =================

class AssignTaskRequest(BaseModel):
    user_id: int