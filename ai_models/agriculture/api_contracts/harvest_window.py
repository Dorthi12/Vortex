from pydantic import BaseModel, Field
from datetime import date

class HarvestWindowRequest(BaseModel):
    crop: str
    planting_date: date
    district: str
    gdd_accumulated: float = Field(..., ge=0, description="Growing Degree Days accumulated")

class HarvestWindowResponse(BaseModel):
    optimal_start_date: date
    optimal_end_date: date
    risk_factor: str = Field(..., description="Low, Medium, High (e.g. frost risk, monsoon overlay)")
    confidence: float
