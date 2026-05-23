
import sqlite3
import os

db_path = "data/todo.db"
if not os.path.exists(db_path):
    print(f"Database file not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, role, status FROM users")
    rows = cursor.fetchall()
    print("Users in database:")
    for row in rows:
        print(row)
    conn.close()
