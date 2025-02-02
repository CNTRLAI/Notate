from src.endpoint.models import QueryRequest


def form_messages(data: QueryRequest):
    try:
        if not data.prompt:
            raise ValueError("System prompt cannot be null")

        query_content = data.query if hasattr(
            data, 'query') else data.input

        if not query_content:
            raise ValueError("User query/input cannot be null")

        messages = [
            {"role": "system", "content": data.prompt},
            {"role": "user", "content": query_content}
        ]
        return messages
    except Exception as e:
        print(f"Error in form_messages: {str(e)}")
        raise e
