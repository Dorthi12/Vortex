from pydantic import BaseModel, Field

class SubsidyRequest(BaseModel):
    state: str
    farmer_category: str = Field(..., description="Small, Marginal, Large, SC/ST, Woman")
    land_size_hectares: float = Field(..., ge=0)
    crop_type: str

class SubsidyResponse(BaseModel):
    eligible_schemes: list = Field(default_factory=list, description="Array of subsidy details")
    total_benefits_value_inr: float = Field(..., ge=0)
    required_documents: list = Field(default_factory=list)
