from pydantic import BaseModel, Field
from datetime import date

class MandiPriceRequest(BaseModel):
    market_name: str = Field(..., description="Mandi market place")
    commodity: str = Field(..., description="Commodity name")
    target_date: date = Field(..., description="Future date to forecast")

class MandiPriceResponse(BaseModel):
    commodity: str
    market_name: str
    forecasted_price_quintal: float = Field(..., ge=0.0, description="Price in INR per Quintal (100kg)")
    confidence: float
    historical_price_trend: list = Field(default_factory=list)
