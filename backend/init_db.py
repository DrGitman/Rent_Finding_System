"""
Initialize the Rent Scout database with all tables and schemas.
Run this after Docker containers are up and PostgreSQL is ready.
"""

import os
import sys
import time
import psycopg2
from psycopg2 import sql
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "rentscout_db")
DB_USER = os.getenv("DB_USER", "rentscout")
DB_PASSWORD = os.getenv("DB_PASSWORD", "rentscout")

# Read SQL initialization script
SQL_FILE = os.path.join(os.path.dirname(__file__), "migrations", "init.sql")

def wait_for_postgres(max_retries=30):
    """Wait for PostgreSQL to be ready."""
    logger.info(f"Waiting for PostgreSQL at {DB_HOST}:{DB_PORT}...")
    
    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME,
                connect_timeout=5
            )
            conn.close()
            logger.info("✓ PostgreSQL is ready!")
            return True
        except psycopg2.OperationalError as e:
            if attempt < max_retries - 1:
                logger.info(f"  Attempt {attempt+1}/{max_retries}... Retrying in 1 second")
                time.sleep(1)
            else:
                logger.error(f"✗ Failed to connect to PostgreSQL: {e}")
                return False
    
    return False

def init_database():
    """Initialize database with SQL schema."""
    try:
        # Read SQL file
        if not os.path.exists(SQL_FILE):
            logger.error(f"✗ SQL file not found: {SQL_FILE}")
            return False
        
        with open(SQL_FILE, 'r') as f:
            sql_commands = f.read()
        
        # Connect to database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = conn.cursor()
        
        # Execute SQL commands
        logger.info("Initializing database schema...")
        cursor.execute(sql_commands)
        conn.commit()
        
        # Count tables
        cursor.execute("""
            SELECT count(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
        """)
        table_count = cursor.fetchone()[0]
        
        logger.info(f"✓ Database initialized successfully!")
        logger.info(f"  Created {table_count} tables")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"✗ Database initialization failed: {e}")
        return False

def verify_tables():
    """Verify that all expected tables exist."""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = conn.cursor()
        
        # List all tables
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        if tables:
            logger.info("✓ Tables in database:")
            for (table,) in tables:
                logger.info(f"  - {table}")
        else:
            logger.warning("⚠ No tables found in database")
        
        cursor.close()
        conn.close()
        return len(tables) > 0
        
    except Exception as e:
        logger.error(f"✗ Failed to verify tables: {e}")
        return False

def main():
    """Main initialization routine."""
    logger.info("=" * 70)
    logger.info("  RENT SCOUT - DATABASE INITIALIZATION")
    logger.info("=" * 70)
    
    # Wait for PostgreSQL
    if not wait_for_postgres():
        logger.error("✗ Could not connect to PostgreSQL")
        return False
    
    # Initialize database
    if not init_database():
        logger.error("✗ Database initialization failed")
        return False
    
    # Verify tables
    if not verify_tables():
        logger.warning("⚠ Could not verify tables")
        return False
    
    logger.info("=" * 70)
    logger.info("✓ DATABASE INITIALIZATION COMPLETE")
    logger.info("=" * 70)
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
