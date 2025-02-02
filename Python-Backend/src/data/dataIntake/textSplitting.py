from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import logging


def split_text(text: str, file_path: str, metadata: dict = None) -> list:
    """Split text into chunks for embedding."""
    try:
        # Handle None or empty text
        if not text:
            logging.error(f"Empty or None text received from {file_path}")
            return []

        # Pre-process text to remove excessive whitespace
        text = " ".join(text.split())

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=20,
            length_function=len,
            is_separator_regex=False,
            # Prioritize sentence boundaries
            separators=[". ", "? ", "! ", "\n\n", "\n", " ", ""]
        )

        # Directly split text and create documents in one go
        texts = text_splitter.split_text(text)

        # Create metadata if none provided
        if metadata is None:
            metadata = {}
        metadata["source"] = file_path

        docs = [Document(page_content=t.strip(), metadata=metadata.copy())
                for t in texts]

        if not docs:
            logging.warning(
                f"No documents created after splitting text from {file_path}")
        else:
            logging.info(
                f"Successfully split text into {len(docs)} chunks from {file_path}")

        return docs
    except Exception as e:
        logging.error(f"Error splitting text from {file_path}: {str(e)}")
        return []
