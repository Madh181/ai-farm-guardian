#!/usr/bin/env python3
"""
Migration script to add latitude and longitude columns to fields table.
Run this once to update the database schema.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "farmguardian.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(fields)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "latitude" not in columns:
        print("Adding 'latitude' column to fields table...")
        cursor.execute("ALTER TABLE fields ADD COLUMN latitude FLOAT NULL")
        print("✓ Added latitude column")
    else:
        print("✓ latitude column already exists")
    
    if "longitude" not in columns:
        print("Adding 'longitude' column to fields table...")
        cursor.execute("ALTER TABLE fields ADD COLUMN longitude FLOAT NULL")
        print("✓ Added longitude column")
    else:
        print("✓ longitude column already exists")
    
    conn.commit()
    conn.close()
    print("\n✓ Migration completed successfully!")

if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print("Database not found. Run the backend first to initialize it.")
    else:
        migrate()
