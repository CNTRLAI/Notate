import time


def chunk_list(lst, n):
    """Yield successive n-sized chunks from lst."""
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


def embed_chunk(args):
    """Embed a chunk of documents."""
    vectordb, chunk, chunk_num, total_chunks, start_time, time_history = args
    try:
        vectordb.add_documents(chunk)

        # Calculate time taken for this chunk
        current_time = time.time()
        chunk_time = current_time - start_time
        time_history.append(chunk_time)

        # Keep only last 5 times
        if len(time_history) > 5:
            time_history.popleft()

        # Basic stats to return for all chunks
        result = {
            "chunk": chunk_num,
            "total_chunks": total_chunks,
            "docs_in_chunk": len(chunk),
            "percent_complete": round((chunk_num / total_chunks * 100), 2),
            "elapsed_time": current_time - start_time,
        }

        # Only add time estimates after 20 chunks and if we have enough data points
        if chunk_num >= 20 and len(time_history) >= 3:
            current_avg_time = sum(time_history) / len(time_history)

            # Store the lowest average time seen so far
            if not hasattr(embed_chunk, 'lowest_avg_time') or current_avg_time < embed_chunk.lowest_avg_time:
                embed_chunk.lowest_avg_time = current_avg_time

            remaining_chunks = total_chunks - chunk_num
            est_remaining_time = remaining_chunks * embed_chunk.lowest_avg_time
            est_finish_time = time.strftime(
                '%H:%M:%S', time.localtime(current_time + est_remaining_time))
            est_remaining_time_formatted = time.strftime(
                '%H:%M:%S', time.gmtime(est_remaining_time))

            result.update({
                "est_finish_time": est_finish_time,
                "time_per_chunk": embed_chunk.lowest_avg_time,
                "remaining_chunks": remaining_chunks,
                "est_remaining_time": est_remaining_time_formatted
            })
        else:
            result.update({
                "est_finish_time": "calculating...",
                "time_per_chunk": "calculating...",
                "remaining_chunks": total_chunks - chunk_num,
                "est_remaining_time": "calculating..."
            })

        return result
    except Exception as e:
        raise Exception(
            f"Error embedding chunk {chunk_num}/{total_chunks}: {str(e)}")
