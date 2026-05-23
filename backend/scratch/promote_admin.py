
import sqlite3
import os

db_path = "data/todo.db"
if not os.path.exists(db_path):
    print(f"Database file not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET role = 'Admin' WHERE email = 'default@local'")
    conn.commit()
    print(f"Updated {cursor.rowcount} user(s) to Admin.")
    conn.close()
