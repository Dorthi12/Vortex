from pydantic import BaseModel, Field

class GrowthStageRequest(BaseModel):
    image_base64: str
    crop: str

class GrowthStageResponse(BaseModel):
    detected_stage: str = Field(..., description="E.g., Germination, Vegetative, Flowering, Maturity")
    confidence: float
    growth_index: float = Field(..., description="Normalized stage score between 0.0 and 1.0")
