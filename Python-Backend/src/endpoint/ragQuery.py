from src.endpoint.models import VectorStoreQueryRequest, ChatCompletionRequest
from src.endpoint.vectorQuery import query_vectorstore
from src.llms.llmQuery import llm_query


async def rag_query(data: VectorStoreQueryRequest, collectionInfo):
    try:
        results = query_vectorstore(data, data.is_local)
        data.prompt = f"The following is the data that the user has provided via their custom data collection: " + \
            f"\n\n{results}" + \
            f"\n\nCollection/Store Name: {collectionInfo.name}" + \
            f"\n\nCollection/Store Files: {collectionInfo.files}" + \
            f"\n\nCollection/Store Description: {collectionInfo.description}"

        chat_completion_request = ChatCompletionRequest(
            messages=[
                {
                    "role": "system",
                    "content": data.prompt
                },
                {
                    "role": "user",
                    "content": data.query
                }
            ],
            model=data.model,
            temperature=data.temperature,
            max_completion_tokens=data.max_completion_tokens,
            top_p=data.top_p,
            frequency_penalty=data.frequency_penalty,
            presence_penalty=data.presence_penalty,
            provider=data.provider,
            is_local=data.is_local
        )
        llm_response = await llm_query(chat_completion_request, data.api_key)
        return llm_response
    except Exception as e:
        print(e)
        raise e
