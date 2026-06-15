from pydantic import BaseModel, Field

class CreditRiskRequest(BaseModel):
    farmer_id: str
    annual_income_inr: float = Field(..., ge=0)
    land_valuation_inr: float = Field(..., ge=0)
    loan_amount_requested: float = Field(..., ge=0)
    past_default_history: bool = Field(...)
    predicted_yield_tonnes: float = Field(..., ge=0)

class CreditRiskResponse(BaseModel):
    approval_recommendation: bool
    credit_score: float = Field(..., ge=300.0, le=900.0)
    risk_rating: str = Field(..., description="AAA, AA, A, B, C, D")
    confidence: float
