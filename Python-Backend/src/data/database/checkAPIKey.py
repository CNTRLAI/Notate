from src.data.database.db import db


def check_api_key(user_id: int):
    """ check to see if the userId has API key in SQLite """
    print("Checking API key for user:", user_id)
    try:
        conn = db()
        if not conn:
            print("Failed to connect to database")
            return False

        cursor = conn.cursor()

        # Check for valid, non-expired API key
        cursor.execute("""
            SELECT * FROM dev_api_keys 
            WHERE user_id = ? 
        """, (user_id,))

        api_key = cursor.fetchone()
        conn.close()
        print(f"API key count for user {user_id}: {api_key}")
        return api_key is not None

    except Exception as e:
        print(f"Error checking API key: {e}")
        return False
