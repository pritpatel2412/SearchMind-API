import logging
from typing import Optional
from openai import AsyncOpenAI
from app.config import settings

logger = logging.getLogger("searchmind.vision")

class VisionService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.client = None
        if self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key)
        else:
            logger.warning("OPENAI_API_KEY not set. Vision extraction will not function.")

    async def describe_image(self, base64_image: str, mime_type: str = "image/jpeg") -> str:
        """
        Takes a base64 encoded image and returns a text description using a Vision LLM.
        """
        if not self.client:
            return "Vision extraction unavailable (no API key)."
            
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Describe the contents, data, or text of this image in a highly detailed but concise markdown format. If it contains a chart, summarize the data. If it contains text, transcribe the key parts. If it is just a decorative image, briefly state that."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{base64_image}",
                                    "detail": "auto"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=300
            )
            
            return response.choices[0].message.content or "No description generated."
        except Exception as e:
            logger.error(f"Failed to describe image: {e}")
            return "Vision extraction failed."

vision_service = VisionService()
