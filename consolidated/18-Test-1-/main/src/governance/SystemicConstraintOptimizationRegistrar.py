# SCOR (Systemic Constraint Optimization Registrar) Module
# AGI Mandate v94.1: Autonomous Code Evolution & Scaffolding
# GSEP Scope: Stage 3/4 Boundary (S-04 Calculation - Constraint Vector Mapping)
# Mandate: Model long-term systemic entropy and architectural cost (Technical Debt) of Mutation Payload (M-02).

from systems.models.M02_Payload import MutationPayload
from policy.RuleSource import GovernanceRuleSource
from metrics.AttestationRegistrar import TIAR
from governance.ConstraintKeys import ConstraintKey
from governance.GovernanceAuditStream import GovernanceAuditStream
from governance.scor.SCORCalculationError import SCORCalculationError
from typing import Any, Callable, TypeAlias

# Type Alias for SCOR's internal state vector (Constraint Key -> Calculated Penalty)
ConstraintVector: TypeAlias = dict[str, float]

class SCOR:
    """
    The Systemic Constraint Optimization Registrar (SCOR) calculates S-04, the metric 
    quantifying projected architectural degradation (Technical Debt) incurred by the 
    Mutation Payload (M-02). 
    
    Calculation methods utilize dynamic dispatch validated during initialization.
    """

    # Maps ConstraintKey to the internal method name
    _CONSTRAINT_MAPPING: dict[ConstraintKey, str] = {
        ConstraintKey.COUPLING_PENALTY: '_calculate_coupling_penalty',
        ConstraintKey.RESOURCE_DEBT: '_calculate_resource_debt',
        ConstraintKey.POLICY_DEVIATION: '_calculate_policy_deviation',
    }

    def __init__(self, grs: GovernanceRuleSource):
        if not isinstance(grs, GovernanceRuleSource):
            raise ValueError("SCOR requires a valid GovernanceRuleSource for initialization.")
            
        self.grs = grs
        # Internal state to hold calculated constraint components
        self._constraint_vector: ConstraintVector = {}
        # Pre-fetch and validate penalty methods for faster runtime access
        self._method_cache: dict[ConstraintKey, Callable[[MutationPayload], float]] = self._build_method_cache()

    def _build_method_cache(self) -> dict[ConstraintKey, Callable[[MutationPayload], float]]:
        """Maps ConstraintKeys directly to their bound calculation methods and validates implementation presence."""
        cache = {}
        for key, method_name in self._CONSTRAINT_MAPPING.items():
            method = getattr(self, method_name, None)
            if method is None:
                 # Fail early if configuration is incorrect
                 raise NotImplementedError(f"SCOR configuration missing implementation for method: {method_name}")
            cache[key] = method
        return cache

    # --- Constraint Calculation Implementations ---

    def _calculate_coupling_penalty(self, payload: MutationPayload) -> float:
        """S-04.C1: Penalty based on cross-module coupling coefficient and risk weight."""
        try:
            risk_weight = self.grs.get_weight('COUPLING_RISK')
            return payload.analyze_coupling_change() * risk_weight
        except Exception as e:
            raise SCORCalculationError(
                key=ConstraintKey.COUPLING_PENALTY, detail="Coupling analysis failed in payload." 
            ) from e

    def _calculate_resource_debt(self, payload: MutationPayload) -> float:
        """S-04.C2: Projects the long-term resource elasticity debt projection."""
        try:
            return payload.project_long_term_resource_cost()
        except Exception as e:
            raise SCORCalculationError(
                key=ConstraintKey.RESOURCE_DEBT, detail="Resource projection failed in payload."
            ) from e

    def _calculate_policy_deviation(self, payload: MutationPayload) -> float:
        """S-04.C3: Assesses penalty for complexity near mandated policy ceilings."""
        try:
            return self.grs.check_complexity_ceiling(payload)
        except Exception as e:
            raise SCORCalculationError(
                key=ConstraintKey.POLICY_DEVIATION, detail="Policy check against ceiling failed."
            ) from e

    # --- Core Execution Logic ---

    def _execute_constraint(self, key: ConstraintKey, payload: MutationPayload) -> float:
        """
        Executes a single constraint calculation using the method cache.
        Handles specific SCOR calculation errors and audits failure via GovernanceAuditStream.
        """
        method = self._method_cache.get(key)

        try:
            penalty = method(payload)
            
            if not isinstance(penalty, (int, float)):
                raise TypeError(f"Constraint {key.value} returned non-numeric result: {type(penalty)}")
            
            # Update state immediately upon successful calculation
            self._constraint_vector[key.value] = float(penalty)
            return float(penalty)
            
        except SCORCalculationError as e:
            # Log structured calculation failures
            GovernanceAuditStream.log_critical_failure(
                component='SCOR', 
                context=f"Constraint {key.value} failed: {e.detail}", 
                error=str(e.__cause__) if e.__cause__ else str(e)
            )
            # Default to 0.0 penalty for stability
            self._constraint_vector[key.value] = 0.0
            return 0.0

    def calculate_S04_metric(self, payload: MutationPayload) -> dict[str, Any]:
        """
        Primary interface: Calculates the aggregated S-04 score.

        Returns: Dictionary containing the total S04_score and the detailed constraint_vector.
        """
        if not isinstance(payload, MutationPayload):
            raise TypeError("S-04 calculation requires a valid MutationPayload object.")
            
        self._constraint_vector = {} 
        S04_score_total = 0.0
        
        # Iterate over the efficient pre-built method cache keys
        for key in self._method_cache.keys():
            S04_score_total += self._execute_constraint(key, payload)
        
        # Register detailed results for historical attestation
        TIAR.register_metric(
            metric_key=ConstraintKey.S04_TOTAL.value, 
            value=S04_score_total, 
            details=self._constraint_vector
        )
        
        return {
            "S04_score_total": S04_score_total,
            "constraint_vector": self._constraint_vector
        }