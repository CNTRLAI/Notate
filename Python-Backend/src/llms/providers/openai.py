from src.endpoint.models import QueryRequest
from openai import OpenAI
from typing import Optional


def openai_query(data: QueryRequest, api_key: Optional[str] = None, messages: list = None):
    try:
        print(f"API key3: {api_key}")
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=data.model,
            messages=messages,
            response_format={
                "type": "text"
            },
            temperature=data.temperature,
            max_completion_tokens=data.max_completion_tokens,
            top_p=data.top_p,
            frequency_penalty=data.frequency_penalty,
            presence_penalty=data.presence_penalty
        )
        # Convert OpenAI response to dict for consistent format
        return response.model_dump()
    except Exception as e:
        print(f"Error in openai_query: {str(e)}")
        raise e
