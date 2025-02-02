import sqlite3
import os
import pathlib
import platform

IS_DEV = os.environ.get("IS_DEV") == "1"


def get_user_data_path():
    system = platform.system()
    home = os.path.expanduser("~")

    if system == "Darwin":  # macOS
        base_path = os.path.join(
            home, "Library", "Application Support", "notate")
    elif system == "Windows":
        base_path = os.path.join(os.getenv("APPDATA"), "notate")
    else:  # Linux and others
        base_path = os.path.join(home, ".config", "notate")

    # Add development subdirectory if in dev mode
    if IS_DEV:
        return os.path.join(base_path, "development")
    return base_path


def db():
    if IS_DEV:
        try:
            # Get the absolute path to the project root
            root_dir = pathlib.Path(__file__).parent.parent.parent.parent
            db_path = os.path.join(root_dir, "..", 'Database', 'database.sqlite')
            # Ensure the Database directory exists
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
            print(f"Connected to Database at: {db_path}")

            return sqlite3.connect(db_path)

        except Exception as e:
            print(f"Error connecting to database: {e}")
            return None

    else:
        # For production, use the user data directory
        user_data_path = get_user_data_path()
        db_dir = os.path.join(user_data_path, "Database")
        db_path = os.path.join(db_dir, "database.sqlite")

        # Ensure the Database directory exists
        os.makedirs(db_dir, exist_ok=True)
        print(f"Connected to Database at: {db_path}")

        return sqlite3.connect(db_path)
