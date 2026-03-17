from pydantic import BaseModel, Field, conint, conlist
from typing import Dict, List, Optional
from enum import Enum

# --- Enums for Configuration Robustness ---

class EnvironmentType(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"

class LoggingLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class ExecutionStrategy(str, Enum):
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    CANARY = "canary"
    AB_TESTING = "ab_testing"
    BLUE_GREEN = "blue_green"

# -------------------------------------------

class StageConfig(BaseModel):
    """Configuration for a specific autonomous stage, enforcing constraints on workers.
    Workers constraint: 1 <= n <= 16.
    """
    workers: conint(ge=1, le=16) = Field(..., description="Number of parallel workers for this stage.")
    strategy: ExecutionStrategy = Field(ExecutionStrategy.PARALLEL, description="The execution strategy (e.g., parallel, canary).")
    timeout_ms: int = Field(5000, description="Stage execution timeout in milliseconds.")

class SystemConfig(BaseModel):
    """The main system configuration schema, enforcing structure and validation.
    Leverages Enums for strict type checking on environment and logging levels.
    """
    environment: EnvironmentType = Field(EnvironmentType.DEVELOPMENT, description="Current operating environment.")
    logging_level: LoggingLevel = Field(LoggingLevel.INFO, description="Standard logging level.")
    database_url: str = Field("sqlite:///./data.db", description="Connection string for the primary database.")
    
    stages: Dict[str, StageConfig] = Field(default_factory=dict, description="Configuration dictionary for specific processing stages.")
    
    enabled_features: conlist(str, min_length=0) = Field(default_factory=list, description="List of feature flags currently enabled.")

    class Config:
        use_enum_values = True
        extra = 'ignore' # Allow unspecified fields without crashing during config load