from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "Spectator"
    phone: Optional[str] = None
    preferred_language: str = "en"

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Zone Schemas
class ZoneBase(BaseModel):
    id: str
    name: str
    capacity: int
    description: Optional[str] = None

class ZoneResponse(ZoneBase):
    class Config:
        from_attributes = True

# Incident Schemas
class IncidentCreate(BaseModel):
    zone_id: str
    title: str
    description: str
    severity: str = "Low"  # Low, Medium, High, Critical

class IncidentAssign(BaseModel):
    volunteer_id: str

class IncidentResponse(BaseModel):
    id: str
    reporter_id: Optional[str] = None
    zone_id: str
    title: str
    description: str
    severity: str
    status: str
    assigned_volunteer_id: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Telemetry Schemas
class TelemetryCreate(BaseModel):
    zone_id: str
    occupancy_count: int
    inflow_rate: int
    outflow_rate: int
    wait_time_seconds: int

class TelemetryResponse(TelemetryCreate):
    id: int
    time: datetime

    class Config:
        from_attributes = True

# Predictive Forecast
class QueueForecast(BaseModel):
    zone_id: str
    predicted_occupancy: int
    predicted_wait_time_seconds: int
    bottleneck_probability: float  # 0.0 to 1.0
    action_required: bool
    recommended_action: Optional[str] = None


class SustainabilityResponse(BaseModel):
    waste_diversion_rate: float
    solar_generation_kw: float
    metro_transit_flow: str
    electric_shuttles_active: int
    electric_shuttles_total: int


# Build Sync: July 15, 2026
