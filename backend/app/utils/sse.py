import json
from typing import AsyncGenerator


def format_sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def queue_to_sse(queue) -> AsyncGenerator[str, None]:
    """Consume (event, data) tuples from an asyncio.Queue until the
    None sentinel arrives, yielding formatted SSE frames."""
    while True:
        item = await queue.get()
        if item is None:
            break
        event, data = item
        yield format_sse(event, data)
