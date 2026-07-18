import sys
import os

# Set paths
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import test functions
from tests.test_auravenue import (
    test_api_get_zones,
    test_api_get_recent_telemetry,
    test_api_get_sustainability,
    test_api_get_forecast,
    test_api_auth_lifecycle,
    test_api_incidents_security_block,
    test_password_hashing,
    test_jwt_token_generation,
    test_telemetry_flow_bottleneck_prediction,
    test_incident_dispatch_lifecycle,
    test_ai_service_incident_summarization_fallback,
    test_ai_service_multilingual_alert_fallback
)

if __name__ == "__main__":
    print("=" * 60)
    print(" AURAVENUE MANUAL TEST RUNNER (STANDARD LIBRARY ONLY)")
    print("=" * 60)
    
    try:
        test_api_get_zones()
        print("PASS: test_api_get_zones")

        test_api_get_recent_telemetry()
        print("PASS: test_api_get_recent_telemetry")

        test_api_get_sustainability()
        print("PASS: test_api_get_sustainability")

        test_api_get_forecast()
        print("PASS: test_api_get_forecast")

        test_api_auth_lifecycle()
        print("PASS: test_api_auth_lifecycle")

        test_api_incidents_security_block()
        print("PASS: test_api_incidents_security_block")

        test_password_hashing()
        print("PASS: test_password_hashing")
        
        test_jwt_token_generation()
        print("PASS: test_jwt_token_generation")

        test_telemetry_flow_bottleneck_prediction()
        print("PASS: test_telemetry_flow_bottleneck_prediction")

        test_incident_dispatch_lifecycle()
        print("PASS: test_incident_dispatch_lifecycle")
        
        test_ai_service_incident_summarization_fallback()
        print("PASS: test_ai_service_incident_summarization_fallback")
        
        test_ai_service_multilingual_alert_fallback()
        print("PASS: test_ai_service_multilingual_alert_fallback")
        
        print("-" * 60)
        print("RESULT: All unit and integration tests executed successfully!")
        print("=" * 60)
    except AssertionError as e:
        print(f"FAIL: Test validation failure: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Unexpected execution failure: {str(e)}")
        sys.exit(1)
