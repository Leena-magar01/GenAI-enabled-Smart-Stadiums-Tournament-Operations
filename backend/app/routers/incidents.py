from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
from app.database.session import get_db
from app.database import models
from app import schemas
from app.routers.auth import get_current_user, require_role

router = APIRouter(prefix="/incidents", tags=["incidents"])

@router.post("/", response_model=schemas.IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_in: schemas.IncidentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify zone exists
    zone = db.query(models.Zone).filter(models.Zone.id == incident_in.zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Zone {incident_in.zone_id} not found"
        )

    incident = models.Incident(
        reporter_id=current_user.id,
        zone_id=incident_in.zone_id,
        title=incident_in.title,
        description=incident_in.description,
        severity=incident_in.severity,
        status="Open"
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident

@router.get("/", response_model=List[schemas.IncidentResponse])
def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    zone_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Incident)
    
    # Non-staff/non-volunteers can only see their own reported incidents
    if current_user.role not in ["SuperAdmin", "StadiaManager", "Volunteer"]:
        query = query.filter(models.Incident.reporter_id == current_user.id)
    
    if status:
        query = query.filter(models.Incident.status == status)
    if severity:
        query = query.filter(models.Incident.severity == severity)
    if zone_id:
        query = query.filter(models.Incident.zone_id == zone_id)
        
    return query.order_by(models.Incident.created_at.desc()).all()

@router.post("/{incident_id}/assign", response_model=schemas.IncidentResponse)
def assign_incident(
    incident_id: str,
    assign_in: schemas.IncidentAssign,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["SuperAdmin", "StadiaManager"]))
):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
        
    volunteer = db.query(models.User).filter(
        models.User.id == assign_in.volunteer_id,
        models.User.role == "Volunteer"
    ).first()
    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer not found"
        )
        
    incident.assigned_volunteer_id = volunteer.id
    incident.status = "Dispatched"
    db.commit()
    db.refresh(incident)
    return incident

@router.post("/{incident_id}/resolve", response_model=schemas.IncidentResponse)
def resolve_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
        
    # Only assigned volunteer, staff, or superadmin can resolve
    if current_user.role not in ["SuperAdmin", "StadiaManager"] and incident.assigned_volunteer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to resolve this incident"
        )
        
    incident.status = "Resolved"
    incident.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(incident)
    return incident

@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["SuperAdmin", "StadiaManager"]))
):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
    db.delete(incident)
    db.commit()
    return None

# Build Sync: July 15, 2026
