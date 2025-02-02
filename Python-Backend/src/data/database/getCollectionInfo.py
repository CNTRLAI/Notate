from src.data.database.db import db
from dataclasses import dataclass
from typing import Optional


@dataclass
class CollectionSettings:
    id: int
    user_id: int
    name: str
    description: str
    is_local: bool
    local_embedding_model: Optional[str]
    type: str
    files: Optional[str]
    created_at: str


def get_collection_settings(user_id: str, collection_name: str) -> Optional[CollectionSettings]:
    """
    Get collection settings for a specific user and collection name
    Args:
        user_id (str): The user ID
        collection_name (str): The name of the collection
    Returns:
        CollectionSettings: Collection settings object or None if not found
    """
    try:
        conn = db()
        if not conn:
            print("Failed to connect to database")
            return None

        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, user_id, name, description, is_local, local_embedding_model, type, files, created_at 
            FROM collections
            WHERE name = ? AND user_id = ?
        """, (collection_name, user_id))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        return CollectionSettings(
            id=row[0],
            user_id=row[1],
            name=row[2],
            description=row[3],
            is_local=bool(row[4]),
            local_embedding_model=row[5],
            type=row[6],
            files=row[7],
            created_at=row[8]
        )

    except Exception as e:
        print(f"Error retrieving collection settings: {e}")
        return None
