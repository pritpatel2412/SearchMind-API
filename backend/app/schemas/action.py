from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Literal

class WebAction(BaseModel):
    action_type: Literal["click", "type", "wait", "submit", "press"] = Field(..., description="The type of action to perform.")
    selector: Optional[str] = Field(None, description="CSS selector for the element to interact with.")
    value: Optional[str] = Field(None, description="Value to type, or key to press.")
    wait_ms: Optional[int] = Field(None, description="Milliseconds to wait if action_type is 'wait'.")

class HITLConfig(BaseModel):
    selector: str = Field(..., description="The CSS selector that indicates human intervention is required (e.g. '#captcha').")
    webhook_url: HttpUrl = Field(..., description="Webhook URL to notify the human.")
    timeout_ms: int = Field(60000, description="How long to wait for the human to resume.")

class ActionRequest(BaseModel):
    url: HttpUrl
    actions: List[WebAction]
    extract_images: bool = False
    return_screenshot: bool = False
    hitl_config: Optional[HITLConfig] = None
    session_id: Optional[str] = Field(None, description="Optional active persistent browser session ID to execute within.")

class HITLResumeRequest(BaseModel):
    value: str = Field(..., description="The value to type into the blocked input (e.g. 2FA code).")

class ActionResponse(BaseModel):
    url: str
    final_html: str
    extracted_content: Optional[str] = None
    screenshot_base64: Optional[str] = None
    success: bool
    error: Optional[str] = None
    session_id: Optional[str] = None

class InstructActionRequest(BaseModel):
    url: Optional[str] = Field(None, description="Target URL (optional if executing inside an existing session with an active page)")
    instruction: str = Field(..., description="Natural language intent (e.g. 'Click the blue Sign In button', 'Type hello into the search box')")
    session_id: Optional[str] = Field(None, description="Optional active persistent browser session ID to execute within")
    return_screenshot: bool = Field(default=False, description="Whether to capture and return base64 screenshot of the post-action page")
    max_retries: int = Field(default=2, ge=0, le=5, description="Self-healing retry budget if element interaction fails")

class InstructActionResponse(BaseModel):
    url: str
    instruction: str
    action_type: str
    target_selector: Optional[str] = None
    target_description: Optional[str] = None
    final_html: str
    extracted_content: Optional[str] = None
    screenshot_base64: Optional[str] = None
    session_id: Optional[str] = None
    success: bool
    error: Optional[str] = None
    self_healed: bool = False

