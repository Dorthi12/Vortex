from pydantic import BaseModel, Field

class AdvisoryRequest(BaseModel):
    district: str
    crop: str
    soil_ph: float
    nitrogen: float
    phosphorus: float
    potassium: float

class AdvisoryResponse(BaseModel):
    advisory_id: str
    soil_analysis: str
    recommended_fertilizers: dict
    subsidies_applicable: list
    market_price_outlook: str
    overall_risk_rating: str
    advisory_summary: str
