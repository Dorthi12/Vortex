from pydantic import BaseModel, Field

class CropYieldRequest(BaseModel):
    crop: str = Field(..., description="Crop name")
    district: str = Field(..., description="District name")
    area_hectares: float = Field(..., ge=0.01, description="Land area in hectares")
    fertilizer_usage_kg: float = Field(..., ge=0, description="Total fertilizer used in kg")
    rainfall_seasonal_mm: float = Field(..., ge=0, description="Seasonal rainfall in mm")

class CropYieldResponse(BaseModel):
    predicted_yield_tonnes: float = Field(..., ge=0.0, description="Predicted crop yield in metric tonnes")
    yield_per_hectare: float = Field(..., description="Tonnes per hectare")
    confidence: float = Field(..., ge=0.0, le=1.0)
