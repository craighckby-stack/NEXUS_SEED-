from typing import Dict, Any, List

class ComplianceReport:
    """
    A structured report detailing compliance outcomes.
    """
    def __init__(self):
        self.is_compliant = True
        self.failures = [] # type: List[Dict[str, str]]

    def add_failure(self, check_id: str, message: str):
        self.is_compliant = False
        self.failures.append({
            "check_id": check_id,
            "message": message
        })

    def __bool__(self):
        return self.is_compliant

class ConstraintComplianceValidator:
    """
    CCV v2.0 (Constraint Compliance Nexus)
    Ensures volatile runtime configurations adhere strictly to immutable
    protocol specifications (GAX mandates) prior to Epoch Manifest Sealing (G0).

    This version provides detailed, granular validation checks and generates
    a comprehensive ComplianceReport rather than relying solely on exceptions.
    Inputs are expected to be pre-parsed structured objects/dictionaries.
    """

    # Define specific Check IDs for granular, machine-readable reporting
    CHECK_PIM_STRUCTURAL = "PIM.C01" # Structure/completeness checks
    CHECK_PIM_SEVERITY = "PIM.C02"   # Severity threshold checks
    CHECK_ORCH_RESOURCES = "ORCH.R01" # Resource boundedness checks (GAX II)

    def __init__(
        self, 
        GAX_MASTER: Dict[str, Any],
        PIM_CONSTRAINTS: Dict[str, Any],
        ORCHESTRATOR_CONFIG: Dict[str, Any]
    ):
        # Configuration inputs are now strongly typed dictionaries, improving initialization clarity.
        self.GAX = GAX_MASTER
        self.PIM = PIM_CONSTRAINTS
        self.ORCH = ORCHESTRATOR_CONFIG

    def _validate_required_p_sets(self, report: ComplianceReport):
        """Checks if all required P-Set types (defined in GAX) are present in PIM_CONSTRAINTS."""
        required_sets = self.GAX.get('protocol_mandates', {}).get('required_p_sets', [])
        actual_sets = self.PIM.get('constraint_sets', {}).keys() if self.PIM.get('constraint_sets') else []

        for required in required_sets:
            if required not in actual_sets:
                report.add_failure(
                    self.CHECK_PIM_STRUCTURAL,
                    f"PIM configuration is missing required P-Set definition: {required}."
                )

    def _validate_severity_thresholds(self, report: ComplianceReport):
        """Checks PIM severity compliance against hard limits defined in GAX_MASTER."""
        gax_limits = self.GAX.get('limits', {}).get('severity_thresholds', {}) 
        pim_thresholds = self.PIM.get('policy', {}).get('severity_levels', {}) 

        for level, limit in gax_limits.items():
            current_threshold = pim_thresholds.get(level)

            if current_threshold is None:
                 # If a mandatory GAX limit is set, the corresponding PIM setting must exist.
                 report.add_failure(
                    self.CHECK_PIM_SEVERITY,
                    f"Required GAX severity level '{level}' is not defined in PIM configuration."
                )
                 continue

            if current_threshold > limit:
                report.add_failure(
                    self.CHECK_PIM_SEVERITY,
                    f"Severity '{level}' ({current_threshold}) exceeds GAX hard limit ({limit})."
                )

    def _validate_orchestrator_limits(self, report: ComplianceReport):
        """Checks resource boundedness and non-zero constraint compliance (GAX II)."""
        stage_limit = self.ORCH.get('gsep_stage_limit_seconds', 0)
        
        if not isinstance(stage_limit, (int, float)) or stage_limit <= 0:
             report.add_failure(
                self.CHECK_ORCH_RESOURCES,
                f"GSEP-C stage limit ({stage_limit}) must be a positive non-zero value, mandated by GAX II."
            )

    def execute_pre_flight_check(self) -> ComplianceReport:
        """
        Executes all compliance checks and returns a comprehensive, structured report.
        The caller is responsible for handling compliance failure (logging or raising).
        """
        report = ComplianceReport()
        
        self._validate_required_p_sets(report)
        self._validate_severity_thresholds(report)
        self._validate_orchestrator_limits(report)

        return report