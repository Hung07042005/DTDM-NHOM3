from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import socket
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from datetime import datetime

from schemas import (
    ContainerResponse,
    ErrorResponse,
    TagCreate,
    TagResponse,
    TagsResponse,
    TaskCreate,
    TaskListCreate,
    TaskListItemResponse,
    TaskListResponse,
    TaskListsResponse,
    TaskListUpdate,
    TaskResponse,
    TagUpdate,
)

app = FastAPI()

DATABASE_URL = "sqlite:///./todo.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("task_lists.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="todo", index=True)
    priority = Column(Integer, nullable=False, default=2, index=True)
    due_date = Column(DateTime, nullable=True, index=True)
    completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    parent_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, unique=True, index=True)
    full_name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class TaskList(Base):
    __tablename__ = "task_lists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    color = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    color = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class TaskTag(Base):
    __tablename__ = "task_tags"

    task_id = Column(Integer, ForeignKey("tasks.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


def ensure_task_table_upgrade():
    migration_sql = [
        "ALTER TABLE tasks ADD COLUMN list_id INTEGER",
        "ALTER TABLE tasks ADD COLUMN description TEXT",
        "ALTER TABLE tasks ADD COLUMN status VARCHAR NOT NULL DEFAULT 'todo'",
        "ALTER TABLE tasks ADD COLUMN priority INTEGER NOT NULL DEFAULT 2",
        "ALTER TABLE tasks ADD COLUMN due_date DATETIME",
        "ALTER TABLE tasks ADD COLUMN completed_at DATETIME",
        "ALTER TABLE tasks ADD COLUMN parent_task_id INTEGER",
        "ALTER TABLE tasks ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE tasks ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    ]

    with engine.begin() as connection:
        for statement in migration_sql:
            try:
                connection.execute(text(statement))
            except Exception:
                pass


def ensure_default_data():
    db: Session = SessionLocal()
    try:
        default_user = db.query(User).filter(User.email == "default@local").first()
        if default_user is None:
            default_user = User(
                email="default@local",
                full_name="Default User",
                password_hash="local-dev-only",
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)

        default_list = db.query(TaskList).filter(
            TaskList.user_id == default_user.id,
            TaskList.name == "Inbox",
        ).first()

        if default_list is None:
            default_list = TaskList(user_id=default_user.id, name="Inbox", color="#007bff")
            db.add(default_list)
            db.commit()
            db.refresh(default_list)

        db.query(Task).filter(Task.list_id.is_(None)).update(
            {Task.list_id: default_list.id},
            synchronize_session=False,
        )
        db.commit()
    finally:
        db.close()


Base.metadata.create_all(bind=engine)
ensure_task_table_upgrade()
ensure_default_data()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={
            "error": "Invalid request",
            "message": "Title field is required"
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "error" in detail and "message" in detail:
        return JSONResponse(status_code=exc.status_code, content=detail)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "Request failed",
            "message": str(detail)
        }
    )


def task_to_dict(task: Task):
    return {
        "id": task.id,
        "title": task.title,
        "completed": task.completed,
    }


def task_list_to_dict(task_list: TaskList):
    return {
        "id": task_list.id,
        "name": task_list.name,
        "color": task_list.color,
    }


def tag_to_dict(tag: Tag):
    return {
        "id": tag.id,
        "name": tag.name,
        "color": tag.color,
    }


def get_default_user(db: Session):
    return db.query(User).filter(User.email == "default@local").first()


def get_default_inbox_list(db: Session, user_id: int):
    return db.query(TaskList).filter(
        TaskList.user_id == user_id,
        TaskList.name == "Inbox",
    ).order_by(TaskList.id.asc()).first()


@app.get("/api/tasks", response_model=TaskListResponse)
def get_tasks():
    db: Session = SessionLocal()
    try:
        db_tasks = db.query(Task).order_by(Task.id.asc()).all()
        return {"tasks": [task_to_dict(task) for task in db_tasks]}
    finally:
        db.close()


@app.post(
    "/api/tasks",
    status_code=201,
    response_model=TaskResponse,
    responses={400: {"model": ErrorResponse}},
)
def create_task(task: TaskCreate):
    if task.title is None or not task.title.strip():
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid request",
                "message": "Title field is required"
            }
        )

    db: Session = SessionLocal()
    try:
        default_list = db.query(TaskList).filter(TaskList.name == "Inbox").order_by(TaskList.id.asc()).first()
        new_task = Task(
            list_id=default_list.id if default_list else None,
            title=task.title.strip(),
            completed=False,
            status="todo",
            priority=2,
        )
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        return task_to_dict(new_task)
    finally:
        db.close()


@app.get("/api/task-lists", response_model=TaskListsResponse)
def get_task_lists():
    db: Session = SessionLocal()
    try:
        default_user = get_default_user(db)
        if default_user is None:
            return {"task_lists": []}

        db_lists = db.query(TaskList).filter(
            TaskList.user_id == default_user.id
        ).order_by(TaskList.id.asc()).all()
        return {"task_lists": [task_list_to_dict(task_list) for task_list in db_lists]}
    finally:
        db.close()


@app.post(
    "/api/task-lists",
    status_code=201,
    response_model=TaskListItemResponse,
    responses={400: {"model": ErrorResponse}},
)
def create_task_list(task_list: TaskListCreate):
    if task_list.name is None or not task_list.name.strip():
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid request", "message": "List name is required"},
        )

    db: Session = SessionLocal()
    try:
        default_user = get_default_user(db)
        if default_user is None:
            raise HTTPException(
                status_code=400,
                detail={"error": "Invalid request", "message": "Default user not found"},
            )

        name = task_list.name.strip()
        existed = db.query(TaskList).filter(
            TaskList.user_id == default_user.id,
            TaskList.name == name,
        ).first()
        if existed is not None:
            raise HTTPException(
                status_code=400,
                detail={"error": "Invalid request", "message": "List name already exists"},
            )

        new_list = TaskList(user_id=default_user.id, name=name, color=task_list.color)
        db.add(new_list)
        db.commit()
        db.refresh(new_list)
        return task_list_to_dict(new_list)
    finally:
        db.close()


@app.put(
    "/api/task-lists/{list_id}",
    response_model=TaskListItemResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def update_task_list(list_id: int, task_list: TaskListUpdate):
    db: Session = SessionLocal()
    try:
        default_user = get_default_user(db)
        if default_user is None:
            raise HTTPException(
                status_code=400,
                detail={"error": "Invalid request", "message": "Default user not found"},
            )

        db_list = db.query(TaskList).filter(
            TaskList.id == list_id,
            TaskList.user_id == default_user.id,
        ).first()
        if db_list is None:
            raise HTTPException(
                status_code=404,
                detail={"error": "Not found", "message": "Task list not found"},
            )

        if task_list.name is not None:
            new_name = task_list.name.strip()
            if not new_name:
                raise HTTPException(
                    status_code=400,
                    detail={"error": "Invalid request", "message": "List name is required"},
                )

            existed = db.query(TaskList).filter(
                TaskList.user_id == default_user.id,
                TaskList.name == new_name,
                TaskList.id != db_list.id,
            ).first()
            if existed is not None:
                raise HTTPException(
                    status_code=400,
                    detail={"error": "Invalid request", "message": "List name already exists"},
                )
            db_list.name = new_name

        if task_list.color is not None:
            db_list.color = task_list.color

        db.commit()
        db.refresh(db_list)
        return task_list_to_dict(db_list)
    finally:
        db.close()


@app.delete(
    "/api/task-lists/{list_id}",
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def delete_task_list(list_id: int):
    db: Session = SessionLocal()
    try:
        default_user = get_default_user(db)
        if default_user is None:
            raise HTTPException(
                status_code=400,
                detail={"error": "Invalid request", "message": "Default user not found"},
            )

        db_list = db.query(TaskList).filter(
            TaskList.id == list_id,
            TaskList.user_id == default_user.id,
        ).first()
        if db_list is None:
            raise HTTPException(
                status_code=404,
                detail={"error": "Not found", "message": "Task list not found"},
            )

        inbox_list = get_default_inbox_list(db, default_user.id)
        if inbox_list is not None and db_list.id == inbox_list.id:
            raise HTTPException(
                status_code=400,
                detail={"error": "Invalid request", "message": "Cannot delete Inbox list"},
            )

        if inbox_list is None:
            inbox_list = TaskList(user_id=default_user.id, name="Inbox", color="#007bff")
            db.add(inbox_list)
            db.commit()
            db.refresh(inbox_list)

        db.query(Task).filter(Task.list_id == db_list.id).update(
            {Task.list_id: inbox_list.id},
            synchronize_session=False,
        )
        db.delete(db_list)
        db.commit()
        return {"message": "Task list deleted"}
    finally:
        db.close()


@app.get("/api/tags", response_model=TagsResponse)
def get_tags():
    db: Session = SessionLocal()
    try:
        default_user = get_default_user(db)
        if default_user is None:
            return {"tags": []}

        db_tags = db.query(Tag).filter(Tag.user_id == default_user.id).order_by(Tag.id.asc()).all()
        return {"tags": [tag_to_dict(tag) for tag in db_tags]}
    finally:
        db.close()


@app.post(
    "/api/tags",
    status_code=201,
    response_model=TagResponse,
    responses={400: {"model": ErrorResponse}},
)
def create_tag(tag: TagCreate):
    if tag.name is None or not tag.name.strip():
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid request", "message": "Tag name is required"},
        )

    db: Session = SessionLocal()
    try:
        default_user = get_default_user(db)
        if default_user is None:
            raise HTTPException(
                status_code=400,
                detail={"error": "Invalid request", "message": "Default user not found"},
            )

        name = tag.name.strip()
        existed = db.query(Tag).filter(
            Tag.user_id == default_user.id,
            Tag.name == name,
        ).first()
        if existed is not None:
            raise HTTPException(
                status_code=400,
                detail={"error": "Invalid request", "message": "Tag name already exists"},
            )

        new_tag = Tag(user_id=default_user.id, name=name, color=tag.color)
        db.add(new_tag)
        db.commit()
        db.refresh(new_tag)
        return tag_to_dict(new_tag)
    finally:
        db.close()


@app.put(
    "/api/tags/{tag_id}",
    response_model=TagResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def update_tag(tag_id: int, tag: TagUpdate):
    db: Session = SessionLocal()
    try:
        default_user = get_default_user(db)
        if default_user is None:
            raise HTTPException(
                status_code=400,
                detail={"error": "Invalid request", "message": "Default user not found"},
            )

        db_tag = db.query(Tag).filter(
            Tag.id == tag_id,
            Tag.user_id == default_user.id,
        ).first()
        if db_tag is None:
            raise HTTPException(
                status_code=404,
                detail={"error": "Not found", "message": "Tag not found"},
            )

        if tag.name is not None:
            new_name = tag.name.strip()
            if not new_name:
                raise HTTPException(
                    status_code=400,
                    detail={"error": "Invalid request", "message": "Tag name is required"},
                )

            existed = db.query(Tag).filter(
                Tag.user_id == default_user.id,
                Tag.name == new_name,
                Tag.id != db_tag.id,
            ).first()
            if existed is not None:
                raise HTTPException(
                    status_code=400,
                    detail={"error": "Invalid request", "message": "Tag name already exists"},
                )
            db_tag.name = new_name

        if tag.color is not None:
            db_tag.color = tag.color

        db.commit()
        db.refresh(db_tag)
        return tag_to_dict(db_tag)
    finally:
        db.close()


@app.delete(
    "/api/tags/{tag_id}",
    responses={404: {"model": ErrorResponse}},
)
def delete_tag(tag_id: int):
    db: Session = SessionLocal()
    try:
        default_user = get_default_user(db)
        if default_user is None:
            raise HTTPException(
                status_code=400,
                detail={"error": "Invalid request", "message": "Default user not found"},
            )

        db_tag = db.query(Tag).filter(
            Tag.id == tag_id,
            Tag.user_id == default_user.id,
        ).first()
        if db_tag is None:
            raise HTTPException(
                status_code=404,
                detail={"error": "Not found", "message": "Tag not found"},
            )

        db.query(TaskTag).filter(TaskTag.tag_id == db_tag.id).delete(synchronize_session=False)
        db.delete(db_tag)
        db.commit()
        return {"message": "Tag deleted"}
    finally:
        db.close()


@app.get("/api/container", response_model=ContainerResponse)
def get_container():
    container_id = socket.gethostname()

    return {
        "container_id": container_id
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)