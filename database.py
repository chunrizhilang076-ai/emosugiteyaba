import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "sunset_game.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            score INTEGER NOT NULL,
            survival_time REAL NOT NULL,
            stars_collected INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def save_score(player_name: str, score: int, survival_time: float, stars_collected: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO scores (player_name, score, survival_time, stars_collected)
        VALUES (?, ?, ?, ?)
    """, (player_name, score, survival_time, stars_collected))
    conn.commit()
    inserted_id = cursor.lastrowid
    conn.close()
    return inserted_id

def get_top_scores(limit: int = 10):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, player_name, score, survival_time, stars_collected,
               datetime(created_at, 'localtime') as created_at
        FROM scores
        ORDER BY score DESC, survival_time DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_stats():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            COUNT(*) as total_plays,
            COALESCE(MAX(score), 0) as high_score,
            COALESCE(AVG(score), 0) as avg_score,
            COALESCE(SUM(stars_collected), 0) as total_stars
        FROM scores
    """)
    stats = cursor.fetchone()
    conn.close()
    return dict(stats) if stats else {}
