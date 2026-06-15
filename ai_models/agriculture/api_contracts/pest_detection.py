from pydantic import BaseModel, Field

class PestRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded leaf/insect image")

class PestResponse(BaseModel):
    pest_detected: str = Field(..., description="Name of detected pest")
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity_level: str = Field(..., description="E.g., Low, Moderate, Severe outbreak")
    countermeasures: list = Field(default_factory=list)
