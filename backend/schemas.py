from typing import Optional

from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    completed: bool


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


class ContainerResponse(BaseModel):
    container_id: str


class ErrorResponse(BaseModel):
    error: str
    message: str