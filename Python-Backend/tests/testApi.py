import pytest
from fastapi.testclient import TestClient
from main import app
from src.endpoint.models import EmbeddingRequest, QueryRequest, YoutubeTranscriptRequest

client = TestClient(app)

def test_embed_endpoint():
    # Test successful embedding
    data = EmbeddingRequest(
        file_path="test_file.txt",
        api_key="test_api_key",
        collection=1,
        collection_name="test_collection",
        user=1,
        metadata={"title": "Test Document"}
    )
    response = client.post("/embed", json=data.dict())
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]

def test_concurrent_embedding():
    # Test that only one embedding process can run at a time
    data = EmbeddingRequest(
        file_path="test_file.txt",
        api_key="test_api_key",
        collection=1,
        collection_name="test_collection",
        user=1,
        metadata={"title": "Test Document"}
    )
    # Start first embedding
    response1 = client.post("/embed", json=data.dict())
    assert response1.status_code == 200
    
    # Try to start second embedding
    response2 = client.post("/embed", json=data.dict())
    assert response2.status_code == 200
    response_data = response2.json()
    assert response_data["status"] == "error"
    assert response_data["message"] == "An embedding process is already running"

def test_youtube_ingest():
    data = YoutubeTranscriptRequest(
        url="https://www.youtube.com/watch?v=test_id",
        user_id=1,
        collection_id=1,
        username="test_user",
        collection_name="test_collection",
        api_key="test_api_key"
    )
    response = client.post("/youtube-ingest", json=data.dict())
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]

def test_cancel_embedding():
    # Test cancelling when no embedding is running
    response = client.post("/cancel-embed")
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["status"] == "error"
    assert response_data["message"] == "No embedding process running"

    # Start an embedding process
    embed_data = EmbeddingRequest(
        file_path="test_file.txt",
        api_key="test_api_key",
        collection=1,
        collection_name="test_collection",
        user=1,
        metadata={"title": "Test Document"}
    )
    embed_response = client.post("/embed", json=embed_data.dict())
    assert embed_response.status_code == 200

    # Cancel the embedding process
    cancel_response = client.post("/cancel-embed")
    assert cancel_response.status_code == 200
    cancel_data = cancel_response.json()
    assert cancel_data["status"] == "success"
    assert cancel_data["message"] == "Embedding process cancelled"

def test_query():
    data = QueryRequest(
        query="test query",
        collection=1,
        collection_name="test_collection",
        user=1,
        api_key="test_api_key",
        top_k=5
    )
    response = client.post("/vector-query", json=data.dict())
    assert response.status_code == 200

    # Test error handling
    invalid_data = QueryRequest(
        query="",  # Empty query should raise an error
        collection=1,
        collection_name="test_collection",
        user=1,
        api_key="test_api_key",
        top_k=5
    )
    response = client.post("/vector-query", json=invalid_data.dict())
    assert response.status_code == 200  # FastAPI still returns 200 but with error message
    response_data = response.json()
    assert response_data["status"] == "error"

# Note: We don't test the restart-server endpoint directly as it would terminate our test process

