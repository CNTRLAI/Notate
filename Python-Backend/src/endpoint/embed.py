from src.data.dataIntake.textSplitting import split_text
from src.data.dataIntake.loadFile import load_document
from src.endpoint.models import EmbeddingRequest
from src.vectorstorage.helpers.sanitizeCollectionName import sanitize_collection_name
from src.vectorstorage.vectorstore import get_vectorstore
from src.vectorstorage.embeddings import embed_chunk, chunk_list

import os
import multiprocessing
import concurrent.futures
import time
from typing import Generator
from collections import deque
import logging

logger = logging.getLogger(__name__)


def embed(data: EmbeddingRequest) -> Generator[dict, None, None]:
    file_name = os.path.basename(data.file_path)
    try:
        yield {"status": "info", "message": f"Starting embedding process for file: {file_name}"}

        text_output = load_document(data.file_path)

        # Handle generator output from CSV loader
        if hasattr(text_output, '__iter__') and not isinstance(text_output, (str, list)):
            texts = []
            for item in text_output:
                if isinstance(item, dict) and "status" in item:
                    # Forward progress updates from CSV processing
                    yield item
                else:
                    texts = item
        else:
            yield {"status": "info", "message": "File loaded successfully"}

            # Check if file is CSV
            if file_name.lower().endswith('.csv'):
                texts = text_output  # CSV loader already returns list of documents
            else:
                # Pass metadata to split_text if it exists
                texts = split_text(text_output, data.file_path,
                                   data.metadata if hasattr(data, 'metadata') else None)

        if not texts:
            raise Exception("No text content extracted from file")

        yield {"status": "info", "message": f"Split text into {len(texts)} chunks"}

        collection_name = sanitize_collection_name(str(data.collection_name))
        vectordb = get_vectorstore(
            data.api_key, collection_name, data.is_local, data.local_embedding_model)
        if not vectordb:
            raise Exception("Failed to initialize vector database")

        chunk_size = 100
        chunks = list(chunk_list(texts, chunk_size))
        total_chunks = len(chunks)
        yield {"status": "info", "message": f"Split into {total_chunks} chunks of {chunk_size} documents each"}

        start_time = time.time()
        time_history = deque(maxlen=5)
        chunk_args = [(vectordb, chunk, i + 1, total_chunks, start_time, time_history)
                      for i, chunk in enumerate(chunks)]

        num_cores = multiprocessing.cpu_count()
        yield {"status": "info", "message": f"Using {num_cores} CPU cores for threading"}

        with concurrent.futures.ThreadPoolExecutor(max_workers=num_cores) as executor:
            for result in executor.map(embed_chunk, chunk_args):
                yield {"status": "progress", "data": result}

        yield {"status": "success", "message": "Embedding completed successfully"}

    except Exception as e:
        error_msg = f"Error embedding file: {str(e)}"
        yield {"status": "error", "message": error_msg}
