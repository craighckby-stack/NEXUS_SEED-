import enum

DEFAULT_ACVD_PATH = 'config/ACVD_constraints.json'

@enum.unique
class ACVDKeys(str, enum.Enum):
    """ Critical structural keys within the Axiomatic Constraint Vetting Document (ACVD). """
    VERSION = 'version'
    UTILITY_THRESHOLDS = 'utility_thresholds'
    POLICY_INVARIANTS = 'policy_invariants'

@enum.unique
class StandardMetrics(str, enum.Enum):
    """ Standardized metrics required for policy enforcement, referenced by PCS. """
    MAX_PROCESSING_TIME = 'max_processing_time'
    MIN_UTILITY_SCORE = 'min_utility_score'
    MAX_RESOURCE_CONSUMPTION = 'max_resource_consumption'
