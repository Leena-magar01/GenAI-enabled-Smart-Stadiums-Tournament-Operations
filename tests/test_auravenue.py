from datetime import datetime, timezone
import jwt
from app.core import security
from app.core.config import settings
from app.services.ai_service import ai_service

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

def test_ai_service_incident_summarization_fallback():
    # Test fallback classification behavior when API key is missing
    raw_report = "Help! Someone just collapsed near Sector 3B concession stand. I think they need a doctor."
    result = ai_service.summarize_incident_report(raw_report)
    
    assert result["category"] == "Medical"
    assert result["severity"] == "Critical"
    assert "Red Cross" in result["action_plan"]

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
