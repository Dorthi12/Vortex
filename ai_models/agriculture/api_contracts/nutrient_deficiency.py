from pydantic import BaseModel, Field

class NutrientDeficiencyRequest(BaseModel):
    image_base64: str = Field(...)

class NutrientDeficiencyResponse(BaseModel):
    deficiency_detected: str = Field(..., description="E.g., Nitrogen, Potassium, Iron deficiency, or None")
    confidence: float
    corrective_actions: list = Field(default_factory=list)
