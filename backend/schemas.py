from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ---- Auth ----
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---- Farm ----
class FarmCreate(BaseModel):
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_acres: Optional[float] = None


class FarmOut(BaseModel):
    id: int
    name: str
    latitude: Optional[float]
    longitude: Optional[float]
    area_acres: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Field ----
class FieldCreate(BaseModel):
    farm_id: int
    name: str
    crop: str
    size_acres: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    growth_stage: Optional[str] = "vegetative"
    planting_date: Optional[datetime] = None
    crop_price_per_kg: Optional[float] = None
    expected_yield_kg_per_acre: Optional[float] = None


class FieldOut(BaseModel):
    id: int
    farm_id: int
    name: str
    crop: str
    size_acres: Optional[float]
    latitude: Optional[float]
    longitude: Optional[float]
    growth_stage: Optional[str]
    planting_date: Optional[datetime]
    crop_price_per_kg: Optional[float]
    expected_yield_kg_per_acre: Optional[float]

    class Config:
        from_attributes = True


# ---- Scan / Priority ----
class ScanOut(BaseModel):
    id: int
    field_id: int
    image_path: Optional[str]
    disease_name: Optional[str]
    confidence: Optional[float]
    severity: Optional[str]
    affected_area_pct: Optional[float]
    issue_type: str
    status: str
    detector_source: str
    created_at: datetime

    class Config:
        from_attributes = True


class PriorityOut(BaseModel):
    id: int
    scan_id: int
    score: float
    tier: str
    reasons: List[str]
    factors: dict
    computed_at: datetime


# ---- Treatment ----
class TreatmentCreate(BaseModel):
    scan_id: int
    action: str
    treatment_type: str = "organic"
    notes: Optional[str] = None


class TreatmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class TreatmentOut(BaseModel):
    id: int
    scan_id: int
    action: str
    treatment_type: str
    status: str
    applied_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Notification ----
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    level: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Chat ----
class ChatRequest(BaseModel):
    message: str
    field_id: Optional[int] = None


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
