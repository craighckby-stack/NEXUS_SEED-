# system/SystemInfo.py

import os
from typing import Dict

class SystemInfo:
    """
    Centralized module for accessing immutable system metadata and current operational state.
    Intended to decouple version and configuration definitions from utilities.
    """
    
    # Default version pulled from environment or deployment descriptor
    DEFAULT_VERSION = "V98.0 Build-A"
    
    @staticmethod
    def get_version() -> str:
        """
        Retrieves the current Sovereign AGI system version.
        Priority: Environment variable (SAG_VERSION) -> Configuration file -> Default.
        """
        return os.environ.get("SAG_VERSION", SystemInfo.DEFAULT_VERSION)

    @staticmethod
    def get_system_metadata() -> Dict[str, str]:
        """
        Returns other critical metadata (e.g., environment, build date).
        """
        return {
            "deployment_env": os.environ.get("SAG_ENV", "PRODUCTION"),
            "build_date": "2024-06-15T12:00:00Z"
        }