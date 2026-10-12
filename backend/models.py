from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farms = relationship("Farm", back_populates="owner", cascade="all, delete-orphan")


class Farm(Base):
    __tablename__ = "farms"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    area_acres = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="farms")
    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")


class Field(Base):
    __tablename__ = "fields"
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"))
    name = Column(String, nullable=False)
    crop = Column(String, nullable=False)
    size_acres = Column(Float, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    growth_stage = Column(String, nullable=True)  # seedling, vegetative, flowering, maturity
    planting_date = Column(DateTime, nullable=True)
    crop_price_per_kg = Column(Float, nullable=True)  # used for economic engine
    expected_yield_kg_per_acre = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="fields")
    scans = relationship("Scan", back_populates="field", cascade="all, delete-orphan")


class Scan(Base):
    __tablename__ = "scans"
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"))
    image_path = Column(String, nullable=True)
    disease_name = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    severity = Column(String, nullable=True)  # low, medium, high
    affected_area_pct = Column(Float, nullable=True)
    issue_type = Column(String, default="disease")  # disease, water_stress, nutrient, pest
    status = Column(String, default="active")  # active, resolved
    detector_source = Column(String, default="heuristic-cv")  # heuristic-cv | yolov11 | manual
    created_at = Column(DateTime, default=datetime.utcnow)

    field = relationship("Field", back_populates="scans")
    priority = relationship("PriorityScore", back_populates="scan", uselist=False, cascade="all, delete-orphan")
    treatments = relationship("Treatment", back_populates="scan", cascade="all, delete-orphan")


class PriorityScore(Base):
    __tablename__ = "priority_scores"
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), unique=True)
    score = Column(Float, nullable=False)
    tier = Column(String, nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    reasons_json = Column(Text, nullable=False)  # json list of strings
    factors_json = Column(Text, nullable=False)  # json dict of sub-scores
    computed_at = Column(DateTime, default=datetime.utcnow)

    scan = relationship("Scan", back_populates="priority")


class Treatment(Base):
    __tablename__ = "treatments"
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"))
    action = Column(Text, nullable=False)
    treatment_type = Column(String, default="organic")  # organic, chemical, cultural
    status = Column(String, default="pending")  # pending, in_progress, completed
    applied_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    scan = relationship("Scan", back_populates="treatments")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    level = Column(String, default="info")  # info, warning, critical
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String, nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
