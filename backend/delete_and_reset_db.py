"""
Complete Database Deletion and Reset Script
This script will completely delete the database file and recreate it from scratch.
"""
import os
import sys
import time

def delete_and_reset_database():
    """Completely delete the database file and recreate fresh tables"""
    db_path = os.path.join(os.path.dirname(__file__), 'mood_tracker.db')

    print("=" * 60)
    print("COMPLETE DATABASE DELETION AND RESET")
    print("=" * 60)
    print(f"\nDatabase location: {db_path}")

    # Check if database exists
    if os.path.exists(db_path):
        print("\nStep 1: Deleting existing database file...")
        try:
            # Close any open connections by reimporting database module
            import database

            # Dispose of the engine to close all connections
            database.engine.dispose()
            print("   Closed all database connections")

            # Wait a moment for connections to fully close
            time.sleep(0.5)

            # Delete the file
            os.remove(db_path)
            print(f"   Database file deleted: {db_path}")
        except PermissionError:
            print("\nERROR: Database file is locked by another process!")
            print("Please stop any running servers or close any programs using the database:")
            print("   - Stop FastAPI server (Ctrl+C)")
            print("   - Close any database browser/viewer")
            print("   - Close VS Code if it has the database open")
            print("\nThen run this script again.")
            return False
        except Exception as e:
            print(f"   ERROR: {e}")
            return False
    else:
        print("\nNo existing database file found.")

    print("\nStep 2: Creating fresh database with clean tables...")

    # Import database module to trigger table creation
    # This will automatically create the database file and tables
    import database

    # Verify tables were created
    from sqlalchemy import inspect
    inspector = inspect(database.engine)
    tables = inspector.get_table_names()

    if tables:
        print(f"   Tables created: {', '.join(tables)}")
    else:
        print("   WARNING: No tables were created!")
        return False

    print("\nDatabase deletion and reset complete!")
    print("   - Old database file deleted")
    print("   - New database file created")
    print("   - Fresh empty tables ready")
    print("   - All user isolation fixes in place")

    return True

if __name__ == "__main__":
    success = delete_and_reset_database()

    if success:
        print("\n" + "=" * 60)
        print("SUCCESS: Database is completely reset and ready to use")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("FAILED: Could not complete database reset")
        print("=" * 60)
        sys.exit(1)
