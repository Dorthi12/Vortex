from pydantic import BaseModel, Field

class RainfallRequest(BaseModel):
    district: str
    month: int = Field(..., ge=1, le=12)
    elevation_m: float
    humidity: float

class RainfallResponse(BaseModel):
    predicted_rainfall_mm: float = Field(..., ge=0.0)
    anomaly_status: str = Field(..., description="Normal, Deficit, Excess")
    confidence: float
