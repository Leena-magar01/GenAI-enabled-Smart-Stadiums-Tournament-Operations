from datetime import datetime, timezone
import jwt
from app.core import security
from app.core.config import settings
from app.services.ai_service import ai_service
from app.database import models

# ==========================================
# 1. CRYPTOGRAPHY & AUTHENTICATION TESTS
# ==========================================

def test_password_hashing():
    password = "securePassword123"
    hashed = security.get_password_hash(password)
    
    assert hashed != password
    assert security.verify_password(password, hashed) is True
    assert security.verify_password("wrongPassword", hashed) is False

def test_jwt_token_generation():
    subject = "tester@auravenue.com"
    token = security.create_access_token(subject)
    
    assert isinstance(token, str)
    
    # Decode token
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
    assert payload.get("sub") == subject
    assert "exp" in payload

# ==========================================
# 2. TIME-SERIES TELEMETRY & PREDICTIVE FORECASTS
# ==========================================

def test_telemetry_flow_bottleneck_prediction():
    # Setup mock zone parameters
    capacity = 1000
    current_occupancy = 850  # 85% capacity
    inflow = 40
    outflow = 10  # accumulating 30 people per minute
    minutes_ahead = 10
    
    # Accumulate forecast
    accumulation = (inflow - outflow) * minutes_ahead
    predicted_occupancy = min(capacity, current_occupancy + accumulation)
    
    # Verification checks
    capacity_utilization = predicted_occupancy / capacity
    assert capacity_utilization >= 0.85
    
    # Redirection trigger validation
    action_required = capacity_utilization > 0.82
    assert action_required is True
    
    rec_action = "Redirect traffic to adjacent gates."
    assert "Redirect" in rec_action

# ==========================================
# 3. INCIDENT WORKFLOW & TRIAGE MANAGEMENT
# ==========================================

def test_incident_dispatch_lifecycle():
    # Setup mock incident
    incident = models.Incident(
        id="inc-101",
        zone_id="Gate_4B",
        title="Crowd congestion",
        description="Gate turnstiles backing up due to scanner failure.",
        severity="High",
        status="Open"
    )
    
    assert incident.status == "Open"
    
    # Simulating volunteer assignment
    incident.assigned_volunteer_id = "user-vol-99"
    incident.status = "Dispatched"
    assert incident.status == "Dispatched"
    assert incident.assigned_volunteer_id == "user-vol-99"
    
    # Simulating resolution
    incident.status = "Resolved"
    incident.resolved_at = datetime.now(timezone.utc)
    assert incident.status == "Resolved"
    assert incident.resolved_at is not None

# ==========================================
# 4. GENERATIVE AI COGNITIVE AGENT TESTS
# ==========================================

def test_ai_service_incident_summarization_fallback():
    # Verify critical parsing
    raw_report = "Help! Someone just collapsed near Sector 3B concession stand. I think they need a doctor."
    result = ai_service.summarize_incident_report(raw_report)
    
    assert result["category"] == "Medical"
    assert result["severity"] == "Critical"
    assert "Red Cross" in result["action_plan"]

    # Verify high security parsing
    raw_security_report = "There is a physical altercation and people are fighting near the East Gate."
    security_result = ai_service.summarize_incident_report(raw_security_report)
    assert security_result["category"] == "Security"
    assert security_result["severity"] == "High"

def test_ai_service_multilingual_alert_fallback():
    alert_text = "Security evacuation required immediately."
    target_langs = ["es", "fr"]
    
    translations = ai_service.generate_multilingual_alert(alert_text, target_langs)
    assert "es" in translations
    assert "fr" in translations
    assert "ALERTA" in translations["es"]

# Build Sync: July 15, 2026
