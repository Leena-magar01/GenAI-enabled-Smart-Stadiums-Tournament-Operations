import sys
import os

# Set paths
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import test functions
from tests.test_auravenue import (
    test_password_hashing,
    test_jwt_token_generation,
    test_ai_service_incident_summarization_fallback,
    test_ai_service_multilingual_alert_fallback
)

if __name__ == "__main__":
    print("=" * 60)
    print(" AURAVENUE MANUAL TEST RUNNER (STANDARD LIBRARY ONLY)")
    print("=" * 60)
    
    try:
        test_password_hashing()
        print("PASS: test_password_hashing")
        
        test_jwt_token_generation()
        print("PASS: test_jwt_token_generation")
        
        test_ai_service_incident_summarization_fallback()
        print("PASS: test_ai_service_incident_summarization_fallback")
        
        test_ai_service_multilingual_alert_fallback()
        print("PASS: test_ai_service_multilingual_alert_fallback")
        
        print("-" * 60)
        print("RESULT: All unit tests executed successfully!")
        print("=" * 60)
    except AssertionError as e:
        print(f"FAIL: Test validation failure: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Unexpected execution failure: {str(e)}")
        sys.exit(1)
