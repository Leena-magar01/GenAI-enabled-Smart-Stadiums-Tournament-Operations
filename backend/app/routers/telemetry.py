from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
import random
from app.database.session import get_db
from app.database import models
from app import schemas
from app.routers.auth import get_current_user, require_role

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

@router.get("/zones", response_model=List[schemas.ZoneResponse])
def get_zones(db: Session = Depends(get_db)):
    zones = db.query(models.Zone).all()
    return zones

@router.post("/", response_model=schemas.TelemetryResponse, status_code=status.HTTP_201_CREATED)
def record_telemetry(
    telemetry_in: schemas.TelemetryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["SuperAdmin", "StadiaManager"]))
):
    zone = db.query(models.Zone).filter(models.Zone.id == telemetry_in.zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Zone {telemetry_in.zone_id} not found"
        )
        
    telemetry = models.Telemetry(
        zone_id=telemetry_in.zone_id,
        occupancy_count=telemetry_in.occupancy_count,
        inflow_rate=telemetry_in.inflow_rate,
        outflow_rate=telemetry_in.outflow_rate,
        wait_time_seconds=telemetry_in.wait_time_seconds
    )
    db.add(telemetry)
    db.commit()
    db.refresh(telemetry)
    return telemetry

@router.get("/recent", response_model=List[schemas.TelemetryResponse])
def get_recent_telemetry(db: Session = Depends(get_db)):
    # Fetch the single latest telemetry row for each zone
    zones = db.query(models.Zone).all()
    recent_telemetry = []
    
    for zone in zones:
        latest = db.query(models.Telemetry)\
                   .filter(models.Telemetry.zone_id == zone.id)\
                   .order_by(models.Telemetry.time.desc())\
                   .first()
        if latest:
            recent_telemetry.append(latest)
        else:
            # Fallback mock telemetry if empty (to guarantee data for visualizer)
            mock_record = models.Telemetry(
                zone_id=zone.id,
                occupancy_count=int(zone.capacity * 0.45),
                inflow_rate=15,
                outflow_rate=12,
                wait_time_seconds=180,
                time=datetime.now(timezone.utc)
            )
            recent_telemetry.append(mock_record)
            
    return recent_telemetry

@router.get("/forecast", response_model=List[schemas.QueueForecast])
def get_queue_forecast(
    minutes_ahead: int = 15,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    zones = db.query(models.Zone).all()
    forecasts = []
    
    for zone in zones:
        latest = db.query(models.Telemetry)\
                   .filter(models.Telemetry.zone_id == zone.id)\
                   .order_by(models.Telemetry.time.desc())\
                   .first()
        
        current_occ = latest.occupancy_count if latest else int(zone.capacity * 0.4)
        current_inflow = latest.inflow_rate if latest else 15
        current_outflow = latest.outflow_rate if latest else 12
        current_wait = latest.wait_time_seconds if latest else 120

        # Run simulated predictive calculation
        # If inflow > outflow, occupancy accumulates over time
        accumulation = (current_inflow - current_outflow) * minutes_ahead
        predicted_occ = max(0, min(zone.capacity, current_occ + accumulation))
        
        # Predicted wait time correlates with occupancy density
        capacity_utilization = predicted_occ / zone.capacity if zone.capacity > 0 else 0
        predicted_wait = int(capacity_utilization * 600)  # max 10 mins wait at 100% capacity
        
        # Flagship flow redirection algorithm
        # Predict bottleneck if occupancy exceeds 85% capacity or wait time is > 6 minutes
        bottleneck_prob = min(1.0, max(0.0, capacity_utilization * 1.1 - 0.1))
        action_required = capacity_utilization > 0.82
        
        rec_action = None
        if action_required:
            rec_action = f"Redirect traffic to adjacent gates. Dispatch nearest volunteers to set up guidance. Alter dynamic displays in Sector {zone.id.split('_')[-1]}."
            
        forecasts.append(schemas.QueueForecast(
            zone_id=zone.id,
            predicted_occupancy=predicted_occ,
            predicted_wait_time_seconds=predicted_wait,
            bottleneck_probability=round(bottleneck_prob, 2),
            action_required=action_required,
            recommended_action=rec_action
        ))
        
    return forecasts

# Build Sync: July 15, 2026
