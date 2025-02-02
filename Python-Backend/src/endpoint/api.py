from typing import AsyncGenerator
import json
from src.endpoint.models import ChatCompletionRequest
from transformers import TextIteratorStreamer
from threading import Thread
import logging
from src.models.manager import model_manager
from src.models.streamer import TextGenerator, StopOnInterrupt
import uuid
import time
import torch
import transformers


logger = logging.getLogger(__name__)


async def chat_completion_stream(request: ChatCompletionRequest) -> AsyncGenerator[str, None]:
    """Stream chat completion from the model"""
    try:
        model = model_manager.current_model
        if not model:
            yield f"data: {json.dumps({'error': 'No model loaded'})}\n\n"
            return
        print(request.messages)
        # Convert messages to prompts

        try:
            prompt = ""  # Initialize prompt variable
            # Format messages without explicit User/Assistant markers
            for msg in request.messages:
                if msg.role == "system":
                    prompt += f"{msg.content}\n"
                elif msg.role == "user":
                    prompt += f"Question: {msg.content}\n"
                elif msg.role == "assistant":
                    prompt += f"Response: {msg.content}\n"
            prompt += "Response: "

            logger.info(f"Generated prompt: {prompt}")
        except Exception as e:
            logger.error(f"Error formatting prompt: {str(e)}", exc_info=True)
            raise

        # Create text generator
        try:
            generator = TextGenerator(
                model, model_manager.current_tokenizer, model_manager.device)

            # For llama.cpp models, we don't need to pre-encode the input
            if model_manager.model_type != "llama.cpp":
                # Only encode for transformers models
                input_ids = model_manager.current_tokenizer.encode(
                    prompt, return_tensors="pt")
                attention_mask = torch.ones_like(input_ids)
                if hasattr(model, "device"):
                    input_ids = input_ids.to(model.device)
                    attention_mask = attention_mask.to(model.device)
        except Exception as e:
            logger.error(
                f"Error setting up generator: {str(e)}", exc_info=True)
            raise

        if request.stream:
            try:
                # Different handling for llama.cpp vs transformers models
                if model_manager.model_type == "llama.cpp":
                    # Use the TextGenerator's built-in streaming for llama.cpp
                    stream_iterator = generator.generate(
                        prompt=prompt,
                        max_new_tokens=min(request.max_tokens or 2048, 2048),
                        temperature=request.temperature or 0.7,
                        top_p=request.top_p or 0.95,
                        top_k=request.top_k or 40,
                        repetition_penalty=1.2,
                        stream=True
                    )
                    async for chunk in stream_iterator:
                        yield chunk
                    yield "data: [DONE]\n\n"
                else:
                    # Set up generation config for transformers models
                    gen_config = {
                        # Cap at 2048 if not specified
                        "max_new_tokens": min(request.max_tokens or 2048, 2048),
                        "temperature": request.temperature or 0.7,
                        "top_p": request.top_p or 0.95,
                        "top_k": request.top_k or 40,  # Slightly lower for more focused sampling
                        "repetition_penalty": 1.2,  # Increased to reduce repetition
                        "do_sample": True,
                        "pad_token_id": model_manager.current_tokenizer.pad_token_id,
                        "eos_token_id": model_manager.current_tokenizer.eos_token_id,
                        "no_repeat_ngram_size": 5,  # Increased to catch longer repetitive phrases
                        "min_new_tokens": 32,  # Increased minimum for more complete thoughts
                        "max_time": 30.0,
                        "stopping_criteria": transformers.StoppingCriteriaList([StopOnInterrupt()]),
                        "forced_eos_token_id": model_manager.current_tokenizer.eos_token_id,
                        "length_penalty": 0.8,  # Slight penalty for longer sequences
                        "num_return_sequences": 1,
                        "remove_invalid_values": True
                    }

                    # Add [END] token to the tokenizer's special tokens
                    special_tokens = {"additional_special_tokens": ["[END]"]}
                    model_manager.current_tokenizer.add_special_tokens(
                        special_tokens)

                    logger.info(f"Generation config: {gen_config}")

                    # Create streamer with token-by-token streaming
                    streamer = TextIteratorStreamer(
                        model_manager.current_tokenizer,
                        skip_prompt=True,
                        skip_special_tokens=True,
                        timeout=None,  # No timeout to prevent queue.Empty errors
                        skip_word_before_colon=False,
                        spaces_between_special_tokens=False,
                        tokenizer_decode_kwargs={"skip_special_tokens": True}
                    )
                    generation_kwargs = dict(
                        input_ids=input_ids,
                        attention_mask=attention_mask,
                        streamer=streamer,
                        **gen_config
                    )

                    # Create thread for generation
                    thread = Thread(target=model.generate,
                                    kwargs=generation_kwargs)
                    thread.start()

                    # Generate a consistent ID for this completion
                    completion_id = f"chatcmpl-{uuid.uuid4()}"

                    # Send the initial role message
                    response = {
                        "id": completion_id,
                        "object": "chat.completion.chunk",
                        "created": int(time.time()),
                        "model": "local-model",
                        "choices": [{
                            "index": 0,
                            "delta": {"role": "assistant"},
                            "finish_reason": None
                        }]
                    }
                    yield f"data: {json.dumps(response)}\n\n"

                    # Stream the output
                    accumulated_text = ""
                    for new_text in streamer:
                        if not new_text:
                            continue

                        # Split into individual characters/tokens for smoother streaming
                        chars = list(new_text)
                        for char in chars:
                            accumulated_text += char
                            response = {
                                "id": completion_id,
                                "object": "chat.completion.chunk",
                                "created": int(time.time()),
                                "model": "local-model",
                                "choices": [{
                                    "index": 0,
                                    "delta": {"content": char},
                                    "finish_reason": None
                                }]
                            }
                            yield f"data: {json.dumps(response)}\n\n"

                    # Send the final message
                    response = {
                        "id": completion_id,
                        "object": "chat.completion.chunk",
                        "created": int(time.time()),
                        "model": "local-model",
                        "choices": [{
                            "index": 0,
                            "delta": {},
                            "finish_reason": "stop"
                        }]
                    }
                    yield f"data: {json.dumps(response)}\n\n"
                    yield "data: [DONE]\n\n"

            except Exception as e:
                logger.error(
                    f"Error during streaming: {str(e)}", exc_info=True)
                raise

    except Exception as e:
        logger.error(f"Error in chat completion: {str(e)}", exc_info=True)
        error_response = {
            "id": f"chatcmpl-{uuid.uuid4()}",
            "object": "chat.completion.chunk",
            "created": int(time.time()),
            "model": "local-model",
            "choices": [{
                "index": 0,
                "delta": {
                    "content": f"Error: {str(e)}"
                },
                "finish_reason": "error"
            }]
        }
        yield f"data: {json.dumps(error_response)}\n\n"
        yield "data: [DONE]\n\n"  # Make sure to send DONE even on error
