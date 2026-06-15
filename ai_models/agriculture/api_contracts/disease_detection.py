from pydantic import BaseModel, Field

class DiseaseRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded string of crop leaf image")
    crop: str = Field("unknown", description="Optional crop filter context")

class DiseaseResponse(BaseModel):
    disease_detected: str = Field(..., description="Name of detected disease or 'Healthy'")
    confidence: float = Field(..., ge=0.0, le=1.0)
    treatment_advisory: list = Field(default_factory=list)
