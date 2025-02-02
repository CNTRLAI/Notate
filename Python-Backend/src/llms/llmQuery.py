from src.endpoint.models import ChatCompletionRequest
from src.llms.providers.ooba import ooba_query
from src.llms.providers.openai import openai_query
from src.llms.providers.ollama import ollama_query
from src.llms.providers.local import local_query
from typing import Optional


async def llm_query(data: ChatCompletionRequest, api_key: Optional[str] = None):
    try:
        if data.is_ooba:
            return ooba_query(data, data.messages)
        elif data.is_ollama is None:
            return ollama_query(data, data.messages)
        elif data.is_local:
            return await local_query(data)
        else:
            return openai_query(data, api_key, data.messages)

    except Exception as e:
        print(f"Error in llm_query: {str(e)}")
        raise e
