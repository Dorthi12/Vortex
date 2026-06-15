from pydantic import BaseModel, Field

class IrrigationRequest(BaseModel):
    crop: str
    soil_moisture_percent: float = Field(..., ge=0, le=100)
    evapotranspiration_mm: float = Field(..., ge=0)
    days_since_last_water: int = Field(..., ge=0)

class IrrigationResponse(BaseModel):
    irrigation_required: bool
    volume_liters_hectare: float = Field(..., ge=0.0)
    urgency: str = Field(..., description="LOW, MEDIUM, HIGH, IMMEDIATE")
