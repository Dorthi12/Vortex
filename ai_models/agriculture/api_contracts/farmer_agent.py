from typing import Optional
from pydantic import BaseModel, Field

class FarmerAgentRequest(BaseModel):
    audio_base64: Optional[str] = Field(None, description="STT input audio base64")
    text_input: Optional[str] = Field(None, description="Text input if no audio")
    input_language: str = Field("Hindi", description="Hindi, Tamil, Telugu, Marathi, Bengali, English")
    output_channel: str = Field("text", description="text or audio")

class FarmerAgentResponse(BaseModel):
    translated_query: str
    agent_text_response: str
    audio_response_base64: Optional[str] = None
    resolved_language: str
