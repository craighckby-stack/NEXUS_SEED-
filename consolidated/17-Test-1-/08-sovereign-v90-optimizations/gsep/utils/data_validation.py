import uuid
import re
from typing import Any, Dict, List, Optional


def validate_uuid(value: str) -> bool:
    """Validates if a string is a valid UUID."""
    try:
        uuid.UUID(value, version=4)
        return True
    except ValueError:
        return False

def validate_semver(value: str) -> bool:
    """Validates if a string follows Semantic Versioning (X.Y.Z)."""
    semver_pattern = re.compile(r"^\d+\.\d+\.\d+$")
    return bool(semver_pattern.match(value))

def validate_sha256(value: str) -> bool:
    """Validates if a string is a 64-character hexadecimal SHA256 hash."""
    sha256_pattern = re.compile(r"^[a-fA-F0-9]{64}$")
    return bool(sha256_pattern.match(value))

def validate_m01_id(value: str) -> bool:
    """Placeholder validation for M-01 Intent ID (assuming standard format M01-XYZ-123)."""
    m01_pattern = re.compile(r"^M01-[A-Z0-9]{3}-[A-Z0-9]{3,10}$")
    return bool(m01_pattern.match(value))

def validate_cfrh_report(report_data: Dict[str, Any]) -> List[str]:
    """Performs format validation against key fields of the CFRH schema."""
    errors = []
    
    if 'failureId' in report_data and not validate_uuid(report_data['failureId']):
        errors.append('Invalid format for failureId (Expected UUID).')
    
    if 'gsepVersion' in report_data and not validate_semver(report_data['gsepVersion']):
        errors.append('Invalid format for gsepVersion (Expected SemVer).')
        
    if 'intentId' in report_data and not validate_m01_id(report_data['intentId']):
        errors.append('Invalid format for intentId (Expected M-01_ID format).')
        
    if 'criticalFailureDetails' in report_data:
        details = report_data['criticalFailureDetails']
        if 'tracebackHash' in details and not validate_sha256(details['tracebackHash']):
            errors.append('Invalid format for tracebackHash (Expected SHA256).')
        if 'contextHash' in details and not validate_sha256(details['contextHash']):
            errors.append('Invalid format for contextHash (Expected SHA256).')
            
    # ISO8601 validation (basic check, could use stricter datetime parsing)
    # Skip for brevity, relying on external libraries or focusing on custom types.
    
    return errors
