from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False, default="Spectator")  # SuperAdmin, StadiaManager, Volunteer, Spectator
    phone = Column(String(30), nullable=True)
    preferred_language = Column(String(10), default="en")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reported_incidents = relationship("Incident", back_populates="reporter", foreign_keys="Incident.reporter_id")
    assigned_incidents = relationship("Incident", back_populates="assigned_volunteer", foreign_keys="Incident.assigned_volunteer_id")


class Zone(Base):
    __tablename__ = "zones"

    id = Column(String(50), primary_key=True)  # e.g. "Gate_4B", "Sector_C"
    name = Column(String(100), nullable=False)
    capacity = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)

    incidents = relationship("Incident", back_populates="zone")
    telemetry = relationship("Telemetry", back_populates="zone")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reporter_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    zone_id = Column(String(50), ForeignKey("zones.id"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False, default="Low")  # Low, Medium, High, Critical
    status = Column(String(20), nullable=False, default="Open")  # Open, Dispatched, Resolved
    assigned_volunteer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    reporter = relationship("User", back_populates="reported_incidents", foreign_keys=[reporter_id])
    assigned_volunteer = relationship("User", back_populates="assigned_incidents", foreign_keys=[assigned_volunteer_id])
    zone = relationship("Zone", back_populates="incidents")


class Telemetry(Base):
    __tablename__ = "crowd_telemetry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    time = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    zone_id = Column(String(50), ForeignKey("zones.id"), nullable=False)
    occupancy_count = Column(Integer, nullable=False)
    inflow_rate = Column(Integer, nullable=False)  # people per minute
    outflow_rate = Column(Integer, nullable=False)  # people per minute
    wait_time_seconds = Column(Integer, nullable=False)

    zone = relationship("Zone", back_populates="telemetry")
