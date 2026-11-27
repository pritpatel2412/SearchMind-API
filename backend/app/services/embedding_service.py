import logging
from typing import List, Dict, Optional

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    RecursiveCharacterTextSplitter = None

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None

from app.config import settings

logger = logging.getLogger("searchmind.embedding")

class EmbeddingService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.client = None
        if self.api_key and AsyncOpenAI:
            self.client = AsyncOpenAI(api_key=self.api_key)
        else:
            logger.warning("OPENAI_API_KEY not set or openai not installed. Embeddings will not be generated.")

        if RecursiveCharacterTextSplitter:
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=150,
                length_function=len,
                is_separator_regex=False,
            )
        else:
            self.text_splitter = None

    async def vectorize_text(self, text: str) -> Optional[List[Dict]]:
        """
        Chunks the text and generates embeddings for each chunk.
        Returns a list of dicts: {"text": chunk, "embedding": [float, ...]}
        """
        if not self.client or not text.strip():
            return None

        chunks = self.text_splitter.split_text(text)
        if not chunks:
            return None

        try:
            response = await self.client.embeddings.create(
                input=chunks,
                model="text-embedding-3-small"
            )
            
            vectors = []
            for i, data in enumerate(response.data):
                vectors.append({
                    "text": chunks[i],
                    "embedding": data.embedding
                })
                
            return vectors
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            return None

embedding_service = EmbeddingService()
