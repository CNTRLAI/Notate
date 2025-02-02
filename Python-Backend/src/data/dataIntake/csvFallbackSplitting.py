from langchain_core.documents import Document
import pandas as pd
import io
import time
from typing import Generator


def split_csv_text(text: str, file_path: str, metadata: dict = None) -> Generator[dict | list, None, None]:
    """Split CSV text into chunks for embedding while preserving row integrity."""
    try:
        # Convert text back to DataFrame using StringIO
        yield {"status": "progress", "data": {"message": "Loading CSV data...", "chunk": 1, "total_chunks": 4, "percent_complete": "25%"}}
        df = pd.read_csv(io.StringIO(text))

        # Get headers
        headers = df.columns.tolist()

        # Calculate approximate number of rows per chunk (targeting ~2000 characters per chunk)
        yield {"status": "progress", "data": {"message": "Calculating chunk sizes...", "chunk": 2, "total_chunks": 4, "percent_complete": "50%"}}
        sample_row = df.iloc[0].to_string(index=False)
        chars_per_row = len(sample_row)
        rows_per_chunk = max(1, int(2000 / chars_per_row))

        documents = []
        total_rows = len(df)
        start_time = time.time()

        # Process DataFrame in chunks
        for i in range(0, total_rows, rows_per_chunk):
            # Calculate progress
            progress = min(100, int((i / total_rows) * 100))
            elapsed_time = time.time() - start_time
            est_remaining_time = "calculating..." if i == 0 else f"{(elapsed_time / (i + 1)) * (total_rows - i):.1f}s"

            yield {
                "status": "progress",
                "data": {
                    "message": f"Processing rows {i} to {min(i + rows_per_chunk, total_rows)}...",
                    "chunk": 3,
                    "total_chunks": 4,
                    "percent_complete": f"{progress}%",
                    "est_remaining_time": est_remaining_time
                }
            }

            chunk_df = df.iloc[i:i + rows_per_chunk]

            # Convert chunk to string more efficiently
            chunk_text = []
            chunk_text.append(",".join(headers))  # Add headers

            # Convert rows to strings efficiently
            for _, row in chunk_df.iterrows():
                chunk_text.append(",".join(str(val) for val in row))

            chunk_content = "\n".join(chunk_text)

            # Create document with metadata
            doc_metadata = {"source": file_path, "chunk_start": i}
            if metadata:
                doc_metadata.update(metadata)

            documents.append(
                Document(page_content=chunk_content, metadata=doc_metadata))

        yield {"status": "progress", "data": {"message": "Finalizing chunks...", "chunk": 4, "total_chunks": 4, "percent_complete": "100%"}}
        print(f"Split CSV into {len(documents)} chunks")
        return documents

    except Exception as e:
        print(f"Error splitting CSV text: {str(e)}")
        yield {"status": "error", "message": f"Error splitting CSV text: {str(e)}"}
        return []
