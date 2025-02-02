import os
from src.endpoint.models import YoutubeTranscriptRequest
from src.vectorstorage.vectorstore import get_vectorstore
from src.vectorstorage.helpers.sanitizeCollectionName import sanitize_collection_name

from langchain_core.documents import Document
import yt_dlp
import logging
import requests
import webvtt
from io import StringIO
from typing import Generator
import json

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def _get_collection_path(user_id, user_name, collection_id, collection_name):
    """Generate the collection path matching the frontend structure"""
    app_data_path = os.path.abspath(os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".."
    ))
    return os.path.join(
        app_data_path,
        "..",
        "FileCollections",
        f"{user_id}_{user_name}",
        f"{collection_id}_{collection_name}"
    )


def youtube_transcript(request: YoutubeTranscriptRequest) -> Generator[dict, None, None]:
    """
    Fetch video transcript and metadata using yt-dlp
    """
    logger.info(f"Starting transcript fetch for URL: {request.url}")
    yield {"status": "progress", "data": {"message": f"Starting transcript fetch for URL: {request.url}", "chunk": 1, "total_chunks": 4, "percent_complete": "0%"}}

    ydl_opts = {
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitlesformat': 'vtt',
        'skip_download': True,
        'quiet': True,  # Suppress yt-dlp's own output
        'no_warnings': True  # Suppress warnings
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Video info extraction (0-5%)
            yield {"status": "progress", "data": {"message": "Extracting video information...", "chunk": 1, "total_chunks": 4, "percent_complete": "5%"}}
            info = ydl.extract_info(request.url, download=False)

            video_info = f"Found video: '{info.get('title', 'Unknown')}' by {info.get('uploader', 'Unknown')}, duration: {info.get('duration', 'Unknown')} seconds"
            logger.info(video_info)
            yield {"status": "progress", "data": {"message": video_info, "chunk": 1, "total_chunks": 4, "percent_complete": "10%"}}

            # Get automatic captions if available
            subtitles = None
            if 'automatic_captions' in info and 'en' in info['automatic_captions']:
                logger.info("Using automatic captions")
                yield {"status": "progress", "data": {"message": "Found automatic captions, processing...", "chunk": 0, "total_chunks": 0, "percent_complete": "0%"}}
                subtitles = info['automatic_captions']['en']
            # Fall back to manual subtitles if available
            elif 'subtitles' in info and 'en' in info['subtitles']:
                logger.info("Using manual subtitles")
                yield {"status": "progress", "data": {"message": "Found manual subtitles, processing...", "chunk": 0, "total_chunks": 0, "percent_complete": "0%"}}
                subtitles = info['subtitles']['en']

            if not subtitles:
                error_msg = "No English subtitles or automatic captions available"
                logger.error(error_msg)
                raise Exception(error_msg)

            # Download the VTT format subtitles
            subtitle_url = None
            for fmt in subtitles:
                if fmt.get('ext') == 'vtt':
                    subtitle_url = fmt['url']
                    break

            if not subtitle_url:
                error_msg = "No VTT format subtitles found"
                logger.error(error_msg)
                raise Exception(error_msg)

            # Update progress for subtitle download (10-15%)
            yield {"status": "progress", "data": {"message": "Downloading subtitles...", "chunk": 2, "total_chunks": 4, "percent_complete": "15%"}}

            # Download the VTT content
            response = requests.get(subtitle_url)
            if response.status_code != 200:
                error_msg = "Failed to download subtitles"
                logger.error(error_msg)
                raise Exception(error_msg)

            # Parse the VTT content
            vtt_content = response.text
            vtt_file = StringIO(vtt_content)
            vtt_captions = webvtt.read_buffer(vtt_file)

            # Start of transcript processing (15-35%)
            yield {"status": "progress", "data": {"message": "Processing subtitles...", "chunk": 2, "total_chunks": 4, "percent_complete": "15%"}}

            def clean_caption(text):
                # Remove common VTT artifacts and clean text
                text = ' '.join(text.split())  # Remove extra whitespace
                # Remove text within brackets (often contains sound effects or speaker labels)
                if text.startswith('[') and text.endswith(']'):
                    return ""
                # Remove common YouTube caption artifacts
                text = text.replace('>>>', '').replace('>>', '')
                # Remove any remaining brackets and their contents
                while '[' in text and ']' in text:
                    start = text.find('[')
                    end = text.find(']') + 1
                    text = text[:start] + text[end:]
                return text.strip()

            def is_substantial_difference(text1, text2):
                # More aggressive deduplication
                if not text1 or not text2:
                    return True

                # Convert to lowercase and split into words
                words1 = text1.lower().split()
                words2 = text2.lower().split()

                # If either text is too short, consider them different
                if len(words1) < 3 or len(words2) < 3:
                    return True

                # Create word sequences for comparison
                seq1 = ' '.join(words1)
                seq2 = ' '.join(words2)

                # Check if one is contained within the other
                if seq1 in seq2 or seq2 in seq1:
                    return False

                # Calculate word overlap
                words1_set = set(words1)
                words2_set = set(words2)
                overlap = len(words1_set.intersection(words2_set))
                max_words = max(len(words1_set), len(words2_set))

                # If more than 50% overlap, consider it a duplicate
                return (overlap / max_words) < 0.5 if max_words > 0 else True

            # Create documents from transcript chunks
            documents = []
            total_captions = len(vtt_captions)
            processed_captions = 0
            chunk_size = 60  # Increased chunk size to 60 seconds
            current_chunk = []
            chunk_start = 0
            chunk_count = 0
            last_text = ""

            # Process captions with progress updates from 15-35%
            for caption in vtt_captions:
                cleaned_text = clean_caption(caption.text)
                if not cleaned_text:
                    continue

                start_seconds = _time_to_seconds(caption.start)

                # Only add text if it's substantially different from the last added text
                if is_substantial_difference(last_text, cleaned_text):
                    # Don't add if it's just a subset of any recent text in current chunk
                    if not any(cleaned_text in existing or existing in cleaned_text
                               for existing in current_chunk[-3:] if current_chunk):
                        current_chunk.append(cleaned_text)
                        last_text = cleaned_text

                # Create new chunk every chunk_size seconds or if chunk is getting too long
                if (start_seconds - chunk_start >= chunk_size and current_chunk) or \
                   (len(' '.join(current_chunk)) > 1000):  # Limit chunk size to ~1000 chars
                    if current_chunk:  # Only create chunk if there's content
                        chunk_count += 1
                        doc = Document(
                            page_content=" ".join(current_chunk),
                            metadata={
                                "title": info.get('title', ''),
                                "description": info.get('description', ''),
                                "author": info.get('uploader', ''),
                                "source": request.url,
                                "chunk_start": chunk_start,
                                "chunk_end": start_seconds,
                                "chunk_number": chunk_count
                            }
                        )
                        documents.append(doc)
                        current_chunk = []
                        chunk_start = start_seconds
                        last_text = ""

                processed_captions += 1
                if processed_captions % 100 == 0:  # Update every 100 captions
                    # Progress from 15% to 35%
                    percent = 15 + ((processed_captions / total_captions) * 20)
                    yield {"status": "progress", "data": {
                        "message": f"Processing transcript: {processed_captions}/{total_captions} captions",
                        "chunk": 2,
                        "total_chunks": 4,
                        "percent_complete": f"{percent:.1f}%"
                    }}

            # Add final chunk if any remains
            if current_chunk:
                chunk_count += 1
                doc = Document(
                    page_content=" ".join(current_chunk),
                    metadata={
                        "title": info.get('title', ''),
                        "description": info.get('description', ''),
                        "author": info.get('uploader', ''),
                        "source": request.url,
                        "chunk_start": chunk_start,
                        "chunk_end": _time_to_seconds(vtt_captions[-1].end),
                        "chunk_number": chunk_count
                    }
                )
                documents.append(doc)

            # Vectorstore initialization (35-40%)
            yield {"status": "progress", "data": {
                "message": "Initializing vector database...",
                "chunk": 3,
                "total_chunks": 4,
                "percent_complete": "40%"
            }}

            # Store documents in ChromaDB
            collection_name = sanitize_collection_name(
                str(request.collection_name))
            vectordb = get_vectorstore(
                request.api_key, collection_name, request.is_local, request.local_embedding_model)
            if not vectordb:
                raise Exception("Failed to initialize vector database")

            # Add documents in batches with progress updates (40-95%)
            total_docs = len(documents)
            docs_processed = 0
            batch_size = 100

            for i in range(0, len(documents), batch_size):
                batch = documents[i:i + batch_size]
                vectordb.add_documents(batch)

                docs_processed += len(batch)
                percent = 40 + ((docs_processed / total_docs)
                                * 55)  # Progress from 40% to 95%
                yield {"status": "progress", "data": {
                    "message": f"Embedding chunks in vector database: {docs_processed}/{total_docs}",
                    "chunk": 4,
                    "total_chunks": 4,
                    "percent_complete": f"{percent:.1f}%"
                }}

            # Final completion (95-100%)
            success_msg = f"Successfully processed and stored {chunk_count} transcript chunks. Total length: {sum(len(doc.page_content) for doc in documents)} characters"
            logger.info(success_msg)
            yield {"status": "progress", "data": {"message": success_msg, "chunk": 4, "total_chunks": 4, "percent_complete": "100%"}}

            # Save transcript to file
            collection_path = _get_collection_path(
                request.user_id,
                request.username,
                request.collection_id,
                request.collection_name
            )

            if not os.path.exists(collection_path):
                os.makedirs(collection_path, exist_ok=True)

            # Create filename using video title and timestamp
            safe_title = "".join(c for c in info.get(
                'title', 'unknown') if c.isalnum() or c in (' ', '-', '_')).rstrip()
            folder_name = f"{safe_title}_youtube"
            folder_path = os.path.join(collection_path, folder_name)
            os.makedirs(folder_path, exist_ok=True)

            # Save metadata
            metadata = {
                "title": info.get('title', ''),
                "uploader": info.get('uploader', ''),
                "duration": info.get('duration', ''),
                "description": info.get('description', ''),
                "url": request.url
            }
            with open(os.path.join(folder_path, "metadata.json"), "w", encoding="utf-8") as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)

            # Save full transcript
            with open(os.path.join(folder_path, "transcript.txt"), "w", encoding="utf-8") as f:
                f.write(f"Title: {info.get('title', 'Unknown')}\n")
                f.write(f"Author: {info.get('uploader', 'Unknown')}\n")
                f.write(f"Duration: {info.get('duration', 'Unknown')} seconds\n")
                f.write(f"Source URL: {request.url}\n")
                f.write("\n--- Transcript ---\n\n")
                for doc in documents:
                    f.write(f"[{doc.metadata['chunk_start']:.1f}s - {doc.metadata['chunk_end']:.1f}s]\n")
                    f.write(f"{doc.page_content}\n\n")

            # Save chunked transcripts with timestamps
            with open(os.path.join(folder_path, "transcript_chunks.json"), "w", encoding="utf-8") as f:
                chunks = [{
                    "content": doc.page_content,
                    "start_time": doc.metadata.get("chunk_start", 0),
                    "end_time": doc.metadata.get("chunk_end", 0),
                    "chunk_number": doc.metadata.get("chunk_number", 0)
                } for doc in documents]
                json.dump(chunks, f, ensure_ascii=False, indent=2)

            # Log success
            logger.info(f"Saved transcript to {folder_path}")

            return documents

    except Exception as e:
        error_msg = f"Error processing YouTube transcript: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise Exception(error_msg)


def _time_to_seconds(time_str):
    """Convert VTT timestamp to seconds"""
    h, m, s = time_str.split(':')
    return float(h) * 3600 + float(m) * 60 + float(s)
