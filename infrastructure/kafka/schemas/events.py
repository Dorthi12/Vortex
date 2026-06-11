from datetime import datetime
from uuid import UUID, uuid4
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field, EmailStr

# ==========================================
# COMMON EVENT ENVELOPE SCHEMA
# ==========================================

class EventEnvelope(BaseModel):
    event_id: UUID = Field(default_factory=uuid4, description="Unique event identifier (UUID)")
    event_type: str = Field(..., description="Categorical type of the event (e.g., complaint_created)")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="ISO8601 UTC timestamp when event occurred")
    source: str = Field(..., description="System, microservice, or portal that generated the event")
    version: str = Field("v1", description="Schema version of the event payload")
    payload: Dict[str, Any] = Field(..., description="Domain-specific event details")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Operational headers, trace context, or routing metrics")

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat()
        }

# ==========================================
# DOMAIN-SPECIFIC PAYLOADS
# ==========================================

class ComplaintPayload(BaseModel):
    complaint_id: str = Field(..., description="Domain identifier for the grievance")
    citizen_id: str = Field(..., description="Identifier of the citizen filing the complaint")
    title: str = Field(..., max_length=150, description="Brief summary of the issue")
    description: str = Field(..., description="Detailed explanation of the complaint")
    category: str = Field(..., description="E.g., sanitation, road, electricity, water")
    district: str = Field(..., description="Administrative district where issue is reported")
    status: str = Field("PENDING", description="Current workflow state (PENDING, IN_PROGRESS, RESOLVED, CLOSED)")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PolicyPayload(BaseModel):
    policy_id: str = Field(..., description="Domain identifier for the policy")
    title: str = Field(..., description="Name of the draft or active policy")
    status: str = Field(..., description="E.g., DRAFT, REVIEW, APPROVED, ARCHIVED")
    department: str = Field(..., description="Admin department owner (e.g., Finance, Education)")
    content_hash: str = Field(..., description="SHA-256 hash of the policy contents for audit integrity")
    updated_by: str = Field(..., description="Officer or service ID who committed this revision")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class WeatherPayload(BaseModel):
    district: str = Field(..., description="District name")
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., description="Relative humidity percentage")
    precipitation: float = Field(..., description="Rain/snow precipitation in mm")
    wind_speed: float = Field(..., description="Wind speed in km/h")
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

class NotificationPayload(BaseModel):
    notification_id: str = Field(..., description="Domain identifier for notification transaction")
    recipient_id: str = Field(..., description="Target citizen or officer ID")
    contact_info: str = Field(..., description="Email address, phone number, or push token")
    channel: str = Field(..., description="E.g., SMS, EMAIL, WHATSAPP, PUSH")
    title: str = Field(..., description="Subject or header text")
    message: str = Field(..., description="Body of the notification message")
    priority: str = Field("MEDIUM", description="E.g., HIGH, MEDIUM, LOW")
    dispatched_at: datetime = Field(default_factory=datetime.utcnow)
