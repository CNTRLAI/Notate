_authentication = {}

_data = {}

_endpoint = {
    # embed.py
    'embeddingsProvider': None,
    'warnFileSize': 26214400, # 25MB
    'maxFileSize': 26214400, # 25MB
    # models.py
    'localEmbeddingModel': 'granite-embedding:278m'
}

_llms = {
    'providers': {
        # ollama.py
        'ollamaHost': 'localhost',
        'ollamaPort': 11434
    }
}

_models = {}

_vectorstorage = {
    # Common
    'max_seq_length': 512,
    # TODO impliment
    'vectorStores': [
        'ChromaDB',
        'PGVector'
    ],
    'defaultVectorStore': 'ChromaDB',
    # Postgres
    'postgresUser': 'postgres',
    'postgresPassword': None,
    'postgresHost': 'localhost',
    'postgresPort': 5432,
    'postgresVectorDatabase': None,
    'postgresVectorTable': 'vectors',

    'embeddingProviders': ['ollama'],    
    'defaultEmbeddingProvider': None,
    # init_store.py and vectorstore.py
    'embeddingModels': [
        'HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5',
        'nomic-ai/nomic-embed-text-v1',
        'Snowflake/snowflake-arctic-embed-l-v2.0'
    ],
    'defaultLocalEmbeddingModel': 'HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5',
    'embeddingModelsDir': None,
    # embeddings.py
    'embed_chunk_keepLast': 5,
    'embed_chunk-minChunkNum': 20,
    'embed_chunk-enoughDataPoints': 3
}

_voice = {}


config = {
    'authentication': _authentication,
    'data': _data,
    'endpoint': _endpoint,
    'llms': _llms,
    'models': _models,
    'vectorstorage': _vectorstorage,
    'voice': _voice
}


