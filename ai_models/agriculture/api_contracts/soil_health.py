from pydantic import BaseModel, Field

class SoilHealthRequest(BaseModel):
    ph: float = Field(..., ge=0, le=14)
    organic_matter_percent: float = Field(..., ge=0, le=100)
    nitrogen: float = Field(..., ge=0)
    phosphorus: float = Field(..., ge=0)
    potassium: float = Field(..., ge=0)
    bulk_density: float = Field(..., ge=0, description="g/cm3")

class SoilHealthResponse(BaseModel):
    health_score: float = Field(..., ge=0.0, le=100.0, description="Composite health index")
    soil_class: str = Field(..., description="E.g., Excellent, Good, Degraded, Critical")
    recommendations: list = Field(default_factory=list)
