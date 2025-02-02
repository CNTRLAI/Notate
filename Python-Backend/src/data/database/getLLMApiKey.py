from src.data.database.db import db


def get_llm_api_key(user_id, provider):
    try:
        conn = db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT key FROM api_keys WHERE user_id = ? AND provider = ?", (user_id, provider))
        result = cursor.fetchone()
        conn.close()
        return result[0] if result else None
    except Exception as e:
        print(f"Error retrieving OpenAI API key: {e}")
        return None
