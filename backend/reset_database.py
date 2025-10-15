"""
Reset Database Script
This script will drop all tables and recreate them, effectively resetting the database.
"""
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import Base, engine
from sqlalchemy import inspect

def reset_database():
    """Drop all tables and recreate them"""
    print("Dropping all existing tables...")

    # Get all table names
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    if tables:
        print(f"   Found tables: {', '.join(tables)}")
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        print("   All tables dropped")
    else:
        print("   No existing tables found")

    print("\nCreating fresh tables...")
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("   All tables created")

    print("\nDatabase reset complete!")
    print("   - All user data has been deleted")
    print("   - All mood entries have been deleted")
    print("   - All settings have been deleted")
    print("   - Fresh tables are ready to use")

if __name__ == "__main__":
    print("=" * 60)
    print("DATABASE RESET")
    print("=" * 60)
    print("\nWARNING: This will delete ALL data in the database!")
    print("   - All users")
    print("   - All mood entries")
    print("   - All settings")
    print("\nThis action cannot be undone.\n")

    response = input("Are you sure you want to continue? (yes/no): ")

    if response.lower() in ['yes', 'y']:
        print("\nProceeding with database reset...\n")
        reset_database()
    else:
        print("\nDatabase reset cancelled")
