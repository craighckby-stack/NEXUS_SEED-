from typing import Final

# --- Sovereign AGI Governance Configuration V94.1 ---

# Endpoint for the Policy Configuration Server (PCS).
# This service vets and deploys governance adjustments.
PCS_ENDPOINT: Final[str] = "https://governance.agi.system:8443/api/v1/proposals"

# Define the maximum acceptable delay (in seconds) before transmission retries timeout.
TRANSMISSION_TIMEOUT_SECONDS: Final[int] = 5

# Define acceptable governance proposal types for easy runtime verification
ACCEPTED_ADJUSTMENT_TYPES: Final[set] = {
    "RESOURCE_ALLOCATION",
    "POLICY_UPDATE",
    "MODULE_HOTFIX",
    "BEHAVIOR_MODIFICATION"
}

# Additional configuration values can be placed here...
