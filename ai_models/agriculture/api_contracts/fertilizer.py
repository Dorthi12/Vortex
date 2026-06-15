from pydantic import BaseModel, Field

class FertilizerRecommendRequest(BaseModel):
    crop: str = Field(..., description="Crop name")
    soil_type: str = Field(..., description="E.g., Clayey, Sandy, Loamy, Alluvial")
    nitrogen: float = Field(..., description="Soil Nitrogen level (mg/kg)")
    phosphorus: float = Field(..., description="Soil Phosphorus level (mg/kg)")
    potassium: float = Field(..., description="Soil Potassium level (mg/kg)")

class FertilizerRecommendResponse(BaseModel):
    crop: str
    soil_type: str
    fertilizers: dict = Field(..., description="DOSAGE mapping (Urea, DAP, MOP in kg/acre)")
    organic_alternatives: list = Field(default_factory=list)
    application_schedule: list = Field(default_factory=list)
