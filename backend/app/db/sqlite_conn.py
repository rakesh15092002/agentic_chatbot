import sqlite3
from pathlib import Path
import os

# Define the database path
DB_PATH = Path("chatbot.db")

def get_connection():
    """
    Returns a SQLite connection with WAL mode enabled for concurrency.
    check_same_thread=False is required for FastAPI async endpoints.
    """
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    
    # CRITICAL FIX: Enable Write-Ahead Logging (WAL)
    # This prevents "database is locked" errors when reading/writing simultaneously.
    conn.execute("PRAGMA journal_mode=WAL;")
    
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn

def init_db():
    """
    Creates tables if they don't exist.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Threads table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        thread_id TEXT,
        role TEXT,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(thread_id) REFERENCES threads(id)
    )
    """)

    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH} (WAL Mode Enabled).")