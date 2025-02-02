from src.data.database.getCollectionInfo import get_collection_settings
from src.data.database.getLLMApiKey import get_llm_api_key
from src.endpoint.models import VectorStoreQueryRequest
from src.endpoint.ragQuery import rag_query
from src.endpoint.vectorQuery import query_vectorstore
from src.llms.llmQuery import llm_query
from src.endpoint.models import ChatCompletionRequest


def vector_call(query_request: VectorStoreQueryRequest, user_id: str):
    print(f"API vector query received for user {user_id}")
    if not query_request.model:
        print(f"No model provided in request body for user {user_id}")
        """ VECTORSTORE QUERY IF NO MODEL PROVIDED IN REQUEST BODY """
        collectionSettings = get_collection_settings(
            user_id, query_request.collection_name)
        if collectionSettings.is_local == False:
            api_key = get_llm_api_key(int(user_id), "openai")
        else:
            api_key = None
        if not collectionSettings:
            raise ValueError("Collection settings not found")

        vectorStoreData = VectorStoreQueryRequest(
            query=query_request.input,
            collection=collectionSettings.id,
            collection_name=query_request.collection_name,
            user=user_id,
            api_key=api_key,
            top_k=query_request.top_k,
            is_local=collectionSettings.is_local,
            local_embedding_model=collectionSettings.local_embedding_model
        )
        return query_vectorstore(vectorStoreData, collectionSettings.is_local)


async def rag_call(query_request: VectorStoreQueryRequest, user_id: str):
    print(f"Model provided in request body for user {user_id}")
    """ MODEL + VECTORSTORE QUERY IF MODEL AND COLLECTION NAME PROVIDED IN REQUEST BODY """
    collectionSettings = get_collection_settings(
        user_id, query_request.collection_name)
    if not collectionSettings:
        raise ValueError("Collection settings not found")
    if query_request.is_local == False:
        api_key = get_llm_api_key(int(user_id), query_request.provider)
    else:
        api_key = None
    ragData = VectorStoreQueryRequest(
        query=query_request.input,
        collection=collectionSettings.id,
        collection_name=query_request.collection_name,
        user=user_id,
        api_key=api_key,
        top_k=query_request.top_k,
        is_local=collectionSettings.is_local,
        local_embedding_model=collectionSettings.local_embedding_model,
        temperature=query_request.temperature,
        max_completion_tokens=query_request.max_completion_tokens,
        top_p=query_request.top_p,
        frequency_penalty=query_request.frequency_penalty,
        presence_penalty=query_request.presence_penalty,
        provider=query_request.provider,
        model=query_request.model,
        is_ooba=query_request.is_ooba
    )
    return await rag_query(ragData, collectionSettings)


async def llm_call(query_request: ChatCompletionRequest, user_id: str):
    print(
        f"Model and collection name provided in request body for user {user_id}")
    """ MODEL QUERY IF MODEL BUT NO COLLECTION NAME PROVIDED IN REQUEST BODY """
    if query_request.is_local == False:
        api_key = get_llm_api_key(int(user_id), query_request.provider)
    else:
        api_key = None
    return await llm_query(query_request, api_key)
