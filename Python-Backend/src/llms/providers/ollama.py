from src.endpoint.models import QueryRequest
import requests
import json
import time



def ollama_query(data: QueryRequest, messages: list = None):
    try:
        print("Local Ollama model enabled")
        model_data = {
            "model": data.model,
            "messages": messages,
            "stream": False,  # Disable streaming for now
            "keep_alive": -1,
            "max_tokens": data.max_completion_tokens,
            "keep_alive": -1,
        }
        print(f"Model data: {model_data}")
        response = requests.post(
            "http://localhost:11434/api/chat", json=model_data)

        print(f"Raw response: {response.text}")

        if response.status_code == 200:
            try:
                response_json = response.json()
                print(f"Parsed response: {response_json}")
                # Extract content from the nested message structure
                content = response_json.get("message", {}).get(
                    "content", "No response from model")

                # Standardized response format
                return {
                    "id": f"local-{data.model}-{int(time.time())}",
                    "choices": [{
                        "finish_reason": "stop",
                        "index": 0,
                        "message": {
                                "content": content,
                                "role": "assistant"
                                }
                    }],
                    "created": int(time.time()),
                    "model": data.model,
                    "object": "chat.completion",
                    "usage": {
                        "completion_tokens": -1,  # Token count not available for local models
                        "prompt_tokens": -1,
                        "total_tokens": -1
                    }
                }
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                raise ValueError(
                    f"Failed to parse response from Ollama: {e}")
        return ollama_query(data)
    except Exception as e:
        print(f"Error in ollama_query: {str(e)}")
        raise e
