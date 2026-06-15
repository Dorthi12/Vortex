from pydantic import BaseModel, Field

class RiskRequest(BaseModel):
    district: str
    crop: str
    weather_risk_score: float = Field(..., ge=0, le=100)
    pest_risk_score: float = Field(..., ge=0, le=100)
    disease_risk_score: float = Field(..., ge=0, le=100)
    market_risk_score: float = Field(..., ge=0, le=100)
    yield_risk_score: float = Field(..., ge=0, le=100)

class RiskResponse(BaseModel):
    composite_risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_category: str = Field(..., description="Low, Medium, High, Critical")
    mitigation_strategies: list = Field(default_factory=list)
