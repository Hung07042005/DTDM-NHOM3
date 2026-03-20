from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "todo"
    due_date: Optional[datetime] = None
    completed: Optional[bool] = False
    priority: Optional[int] = 2


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None
    priority: Optional[int] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    completed: bool
    description: Optional[str] = None
    status: str
    priority: int
    due_date: Optional[datetime] = None
    list_id: Optional[int] = None


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]


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


class TaskListsResponse(BaseModel):
    task_lists: list[TaskListItemResponse]


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


class TagsResponse(BaseModel):
    tags: list[TagResponse]


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


class UsersResponse(BaseModel):
    users: list[UserResponse]


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


class ContainerResponse(BaseModel):
    container_id: str


class ErrorResponse(BaseModel):
    error: str
    message: str