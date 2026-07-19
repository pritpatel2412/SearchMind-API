from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Literal

class WebAction(BaseModel):
    action_type: Literal["click", "type", "wait", "submit", "press"] = Field(..., description="The type of action to perform.")
    selector: Optional[str] = Field(None, description="CSS selector for the element to interact with.")
    value: Optional[str] = Field(None, description="Value to type, or key to press.")
    wait_ms: Optional[int] = Field(None, description="Milliseconds to wait if action_type is 'wait'.")

class ActionRequest(BaseModel):
    url: HttpUrl
    actions: List[WebAction]
    extract_images: bool = False
    return_screenshot: bool = False

class ActionResponse(BaseModel):
    url: str
    final_html: str
    extracted_content: Optional[str] = None
    screenshot_base64: Optional[str] = None
    success: bool
    error: Optional[str] = None
