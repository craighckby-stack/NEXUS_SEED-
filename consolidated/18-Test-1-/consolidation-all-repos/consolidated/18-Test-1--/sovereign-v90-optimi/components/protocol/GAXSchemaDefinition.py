from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class GAXLimits(BaseModel):
    severity_thresholds: Dict[str, float] = Field(description="Hard limits for acceptable severity levels in PIM.")

class GAXProtocolMandates(BaseModel):
    required_p_sets: List[str] = Field(description="Mandatory P-Set types that must be defined in PIM_CONSTRAINTS.")

class GAXMasterSchema(BaseModel):
    version: str
    protocol_mandates: GAXProtocolMandates
    limits: GAXLimits
    architectural_mandate: str = Field(alias="GAX_II")

# Future schemas for PIM_CONSTRAINTS and ORCHESTRATOR_CONFIG would follow here.
# Usage: loaded_data = GAXMasterSchema.parse_obj(raw_yaml_data)