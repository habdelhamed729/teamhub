import json
from langchain_core.runnables import Runnable

async def stream_langchain_chain(chain: Runnable, input_data: dict, sources: list | None = None):
    """
    Generator that streams tokens from a LangChain chain as SSE events.
    Supports sending source chunks before streaming starts (for RAG).
    """
    try:
        # 1. Send sources first if present
        if sources is not None:
            yield {
                "event": "sources",
                "data": json.dumps({"chunks": sources})
            }

        # 2. Stream tokens from the chain
        async for chunk in chain.astream(input_data):
            # chunk can be an AIMessageChunk or a dict
            content = chunk.content if hasattr(chunk, "content") else str(chunk)
            if content:
                yield {
                    "event": "token",
                    "data": json.dumps({"content": content})
                }

        # 3. Send done event
        yield {
            "event": "done",
            "data": json.dumps({"status": "completed"})
        }

    except Exception as e:
        yield {
            "event": "error",
            "data": json.dumps({"message": str(e)})
        }
