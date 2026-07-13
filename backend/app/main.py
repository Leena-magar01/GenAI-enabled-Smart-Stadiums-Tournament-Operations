import asyncio
import logging
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from typing import Dict

from app.core.config import settings
from app.database.session import engine, Base, SessionLocal, get_db
from app.database import models
from app.core import security
from app.routers import auth, incidents, telemetry
from app.services.ai_service import ai_service
from app.services.queue_service import queue_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AuraVenueMain")

async def generate_mock_telemetry_loop():
    """
    Background task to generate dynamic telemetry fluctuations to feed the WebSockets and dashboard.
    """
    await asyncio.sleep(5)
    db = SessionLocal()
    try:
        zones = db.query(models.Zone).all()
        if not zones:
            return
        
        while True:
            for zone in zones:
                # Add slight random variations
                latest = db.query(models.Telemetry)\
                           .filter(models.Telemetry.zone_id == zone.id)\
                           .order_by(models.Telemetry.time.desc())\
                           .first()
                
                curr_occ = latest.occupancy_count if latest else int(zone.capacity * 0.4)
                curr_occ += random.randint(-15, 20)
                curr_occ = max(10, min(zone.capacity, curr_occ))
                
                inflow = random.randint(5, 30)
                outflow = random.randint(5, 28)
                
                capacity_util = curr_occ / zone.capacity if zone.capacity > 0 else 0
                wait_time = int(capacity_util * 480) # wait scaling

                new_telemetry = models.Telemetry(
                    zone_id=zone.id,
                    occupancy_count=curr_occ,
                    inflow_rate=inflow,
                    outflow_rate=outflow,
                    wait_time_seconds=wait_time
                )
                db.add(new_telemetry)
                db.commit()
                
                # Check for critical status to trigger WebSocket alerts
                if capacity_util > 0.85:
                    await queue_service.broadcast_event("crowd_alert", {
                        "zone_id": zone.id,
                        "occupancy": curr_occ,
                        "capacity": zone.capacity,
                        "message": f"Critical bottleneck alert in Sector {zone.id.split('_')[-1]} (Gate Capacity exceeded 85%)",
                        "severity": "High"
                    })
                    
            db.commit()
            await asyncio.sleep(10) # refresh stats every 10s
    except asyncio.CancelledError:
        logger.info("Telemetry generation loop stopped.")
    except Exception as e:
        logger.error(f"Error in telemetry generation loop: {str(e)}")
    finally:
        db.close()

import random # Ensure random is loaded locally inside thread

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Seed Database
    db = SessionLocal()
    try:
        # Check if seed users exist
        admin_exists = db.query(models.User).filter(models.User.email == "admin@auravenue.com").first()
        if not admin_exists:
            # Create users
            admin_user = models.User(
                email="admin@auravenue.com",
                password_hash=security.get_password_hash("admin123"),
                full_name="Alex Mercer (Operations Principal)",
                role="SuperAdmin",
                phone="+1555123456",
                preferred_language="en"
            )
            volunteer_user = models.User(
                email="volunteer@auravenue.com",
                password_hash=security.get_password_hash("volunteer123"),
                full_name="Elena Rostova (L3 Volunteer Coordinator)",
                role="Volunteer",
                phone="+1555987654",
                preferred_language="es"
            )
            spectator_user = models.User(
                email="fan@auravenue.com",
                password_hash=security.get_password_hash("fan123"),
                full_name="David Chen (Stadium Guest)",
                role="Spectator",
                phone="+1555555555",
                preferred_language="en"
            )
            db.add_all([admin_user, volunteer_user, spectator_user])
            logger.info("Seeded default credentials.")
            
        # Check if seed zones exist
        zone_exists = db.query(models.Zone).first()
        if not zone_exists:
            zones_to_seed = [
                models.Zone(id="Gate_1A", name="Gate 1A VIP North entrance", capacity=800, description="Dedicated entry for VIP skyboxes and press credentials."),
                models.Zone(id="Gate_2A", name="Gate 2A North Plaza", capacity=1500, description="General admission for Upper Tier sections 101-115."),
                models.Zone(id="Gate_3B", name="Gate 3B East Concourse", capacity=1800, description="Main gate facing direct metro station pathway."),
                models.Zone(id="Gate_4B", name="Gate 4B East Sector Turnstile", capacity=1200, description="High density check-in with facial ticketing gates."),
                models.Zone(id="Gate_5C", name="Gate 5C West Food Court Plaza", capacity=2500, description="Central food stall cluster and retail hub."),
                models.Zone(id="Gate_6C", name="Gate 6C South Wing Exit", capacity=1400, description="Wide ramp egress pointing to rideshare terminal."),
            ]
            db.add_all(zones_to_seed)
            db.commit()
            logger.info("Seeded initial zones.")
            
            # Seed initial telemetry
            for z in zones_to_seed:
                initial_telemetry = models.Telemetry(
                    zone_id=z.id,
                    occupancy_count=int(z.capacity * 0.5),
                    inflow_rate=20,
                    outflow_rate=18,
                    wait_time_seconds=150
                )
                db.add(initial_telemetry)
            db.commit()
            logger.info("Seeded initial telemetry records.")
            
    except Exception as e:
        logger.error(f"Error seeding DB: {str(e)}")
    finally:
        db.close()
        
    # Start telemetry generator thread
    task = asyncio.create_task(generate_mock_telemetry_loop())
    yield
    # Clean up background tasks
    task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount core routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(telemetry.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs": "/docs"
    }

# Advanced AI processing route
@app.post(f"{settings.API_V1_STR}/ai/parse-report")
def parse_voice_or_text_report(payload: dict, current_user: models.User = Depends(auth.get_current_user)):
    report_text = payload.get("report")
    if not report_text:
        raise HTTPException(status_code=400, detail="Missing report text parameter.")
    
    parsed_report = ai_service.summarize_incident_report(report_text, language=current_user.preferred_language)
    return parsed_report

# Emergency translation broadcast
@app.post(f"{settings.API_V1_STR}/ai/broadcast-alert")
def broadcast_safety_alert(payload: dict, current_user: models.User = Depends(auth.require_role(["SuperAdmin", "StadiaManager"]))):
    alert_text = payload.get("text")
    languages = payload.get("languages", ["es", "fr", "ar", "ja"])
    if not alert_text:
        raise HTTPException(status_code=400, detail="Missing alert text parameter.")
    
    translations = ai_service.generate_multilingual_alert(alert_text, target_langs=languages)
    return {
        "original": alert_text,
        "translations": translations,
        "timestamp": datetime.now(timezone.utc)
    }

# Real-time WebSocket connection
@app.websocket("/api/v1/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    await queue_service.register_connection(client_id, websocket)
    try:
        while True:
            # Echo or receive custom triggers from client
            data = await websocket.receive_text()
            logger.info(f"WebSocket received data from client {client_id}: {data}")
    except WebSocketDisconnect:
        await queue_service.unregister_connection(client_id, websocket)
        logger.info(f"WebSocket disconnected for client {client_id}")

from fastapi.staticfiles import StaticFiles
import os

# Securely mount React build assets
static_path = "static"
if not os.path.exists(static_path):
    os.makedirs(static_path, exist_ok=True)
app.mount("/", StaticFiles(directory=static_path, html=True), name="static")

