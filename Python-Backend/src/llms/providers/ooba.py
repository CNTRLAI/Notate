from src.endpoint.models import QueryRequest
import requests


def ooba_query(data: QueryRequest, messages: list = None):
    try:
        print("Ooba mode enabled")
        ooba_data = {
            "messages": messages,
            "mode": "chat",
            "character": data.character
        }
        response = requests.post(
            "http://127.0.0.1:5000/v1/chat/completions", json=ooba_data)
        return response.json()
    except Exception as e:
        print(f"Error in ooba_query: {str(e)}")
        raise e
