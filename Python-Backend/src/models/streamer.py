import traceback
from queue import Queue
from threading import Thread
from typing import Optional, Callable, Any, List, Union, AsyncIterator, Iterator, Dict
import torch
import time
import asyncio
import json
import logging

logger = logging.getLogger(__name__)


class StopNowException(Exception):
    pass


class StreamingStoppingCriteria:
    """Base class for stopping criteria during text generation"""

    def __init__(self):
        pass

    def __call__(self, input_ids, scores) -> bool:
        return False


class StopOnInterrupt(StreamingStoppingCriteria):
    """Stopping criteria that checks for interruption signals"""

    def __init__(self, stop_signal=None):
        super().__init__()
        self.stop_signal = stop_signal or (lambda: False)

    def __call__(self, input_ids, scores) -> bool:
        return self.stop_signal()


class StreamIterator(AsyncIterator[str], Iterator[str]):
    """Iterator that streams tokens as they are generated."""

    def __init__(self, func: Callable, callback: Optional[Callable] = None):
        self.func = func
        self.callback = callback
        self.queue = Queue()
        self.async_queue = asyncio.Queue()
        self.sentinel = object()
        self.stop_now = False
        self.thread = None

    def _queue_callback(self, data):
        """Callback that puts data into both queues"""
        if self.stop_now:
            raise StopNowException

        if data is None:
            self.queue.put(self.sentinel)
            self.async_queue.put_nowait(None)
            return

        if self.callback:
            self.callback(data)

        formatted_data = f"data: {json.dumps(data)}\n\n"
        self.queue.put(formatted_data)
        self.async_queue.put_nowait(formatted_data)

    def _start_generation(self):
        if not self.thread:
            def task():
                try:
                    self.func(self._queue_callback)
                except StopNowException:
                    pass
                except Exception:
                    traceback.print_exc()
                finally:
                    self._queue_callback(None)

            self.thread = Thread(target=task)
            self.thread.start()

    def __iter__(self) -> Iterator[str]:
        self._start_generation()
        return self

    def __next__(self) -> str:
        if not self.thread:
            self._start_generation()

        item = self.queue.get()
        if item is self.sentinel:
            raise StopIteration
        return item

    def __aiter__(self):
        self._start_generation()
        return self

    async def __anext__(self) -> str:
        if not self.thread:
            self._start_generation()

        try:
            item = await self.async_queue.get()
            if item is None:
                raise StopAsyncIteration
            return item
        except Exception as e:
            if isinstance(e, StopAsyncIteration):
                raise
            raise StopAsyncIteration from e

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop_now = True


class TextGenerator:
    """A text generator that streams tokens as they are generated."""

    def __init__(self, model, tokenizer, device: str = "cpu"):
        self.model = model
        self.tokenizer = tokenizer
        self.device = device
        self.stop_signal = False
        self._log_cuda_status()

    def _log_cuda_status(self):
        """Log CUDA status if available"""
        if hasattr(torch.cuda, 'is_available') and torch.cuda.is_available():
            logger.info("CUDA is available in TextGenerator")
            logger.info(
                f"Model GPU layers: {getattr(self.model, 'n_gpu_layers', 'unknown')}")
            logger.info(
                f"CUDA Memory allocated: {torch.cuda.memory_allocated() / 1024**2:.2f}MB")
            logger.info(
                f"CUDA Memory reserved: {torch.cuda.memory_reserved() / 1024**2:.2f}MB")

    def _create_stream_response(self, text: str, generated_text: str, is_final: bool = False) -> Dict:
        """Create a standardized streaming response"""
        response = {
            "id": "chatcmpl-" + str(hash(generated_text))[-12:],
            "object": "chat.completion.chunk",
            "created": int(time.time()),
            "model": "local-model",
            "choices": [{
                "index": 0,
                "delta": {} if is_final else {"content": text},
                "finish_reason": "stop" if is_final else None
            }]
        }
        return response

    def _stream_tokens(self, callback: Callable, generator, decode_func: Callable) -> str:
        """Generic token streaming implementation"""
        generated_text = ""
        for output in generator:
            text = decode_func(output)
            generated_text += text
            callback(self._create_stream_response(text, generated_text))

        # Send final message
        callback(self._create_stream_response(
            "", generated_text, is_final=True))
        callback(None)
        return generated_text

    def generate(self,
                 prompt: str,
                 max_new_tokens: int = 100,
                 temperature: float = 0.7,
                 top_p: float = 0.95,
                 top_k: int = 50,
                 repetition_penalty: float = 1.1,
                 stopping_criteria: Optional[List[StreamingStoppingCriteria]] = None,
                 callback: Optional[Callable[[dict], Any]] = None,
                 stream: bool = True) -> Union[str, Any]:
        """Generate text from a prompt, optionally streaming the output."""

        if hasattr(self.model, 'create_completion'):
            # llama.cpp model
            completion_args = {
                "prompt": prompt,
                "max_tokens": max_new_tokens,
                "temperature": temperature,
                "top_p": top_p,
                "top_k": top_k,
                "repeat_penalty": repetition_penalty,
                "stream": stream
            }

            if stream:
                def _stream(callback):
                    completion = self.model.create_completion(
                        **completion_args)
                    return self._stream_tokens(
                        callback,
                        completion,
                        lambda x: x["choices"][0]["text"]
                    )
                return StreamIterator(_stream, callback=callback)
            else:
                completion = self.model.create_completion(**completion_args)
                return completion["choices"][0]["text"]
        else:
            # Other models (transformers)
            inputs = self.tokenizer(
                prompt, return_tensors="pt", padding=True).to(self.device)
            gen_config = {
                "max_new_tokens": max_new_tokens,
                "temperature": max(temperature, 1e-2),
                "top_p": min(max(top_p, 0.1), 0.95),
                "top_k": top_k,
                "repetition_penalty": repetition_penalty,
                "do_sample": True,
                "pad_token_id": self.tokenizer.pad_token_id,
                "eos_token_id": self.tokenizer.eos_token_id,
                "use_cache": True
            }

            if stream:
                def _stream(callback):
                    with torch.no_grad():
                        generator = self.model.generate(
                            **inputs,
                            **gen_config,
                            stopping_criteria=stopping_criteria,
                            return_dict_in_generate=True,
                            output_scores=True
                        )
                        return self._stream_tokens(
                            callback,
                            generator,
                            lambda x: self.tokenizer.decode(
                                [x.sequences[0, -1].item() if not isinstance(x,
                                                                             torch.Tensor) else x.item()],
                                skip_special_tokens=True
                            )
                        )
                return StreamIterator(_stream, callback=callback)
            else:
                with torch.no_grad():
                    output = self.model.generate(
                        **inputs,
                        **gen_config,
                        stopping_criteria=stopping_criteria,
                        return_dict_in_generate=True,
                        output_scores=True
                    )
                    return self.tokenizer.decode(output.sequences[0], skip_special_tokens=True)

# End of TextGenerator class - everything after this line should be removed
