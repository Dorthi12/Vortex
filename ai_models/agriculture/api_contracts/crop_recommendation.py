from pydantic import BaseModel, Field

class CropRecommendRequest(BaseModel):
    nitrogen: float = Field(..., ge=0, description="Nitrogen content in soil (mg/kg)")
    phosphorus: float = Field(..., ge=0, description="Phosphorus content in soil (mg/kg)")
    potassium: float = Field(..., ge=0, description="Potassium content in soil (mg/kg)")
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity percentage")
    ph: float = Field(..., ge=0, le=14, description="pH value of the soil")
    rainfall: float = Field(..., ge=0, description="Rainfall in mm")

class CropRecommendResponse(BaseModel):
    recommended_crop: str = Field(..., description="Optimally recommended crop")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of prediction")
    explainability: dict = Field(default_factory=dict, description="SHAP feature importances")
