import logging
from typing import List, Dict, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import AsyncOpenAI
from app.config import settings

logger = logging.getLogger("searchmind.embedding")

class EmbeddingService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.client = None
        if self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key)
        else:
            logger.warning("OPENAI_API_KEY not set. Embeddings will not be generated.")

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150,
            length_function=len,
            is_separator_regex=False,
        )

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
