from typing import Dict, Any, Final, TypedDict


class RiskScoreMetrics(TypedDict):
    """Defines the standardized structure for assessment results, including score and trace data."""
    score: float
    reasoning_data: Dict[str, Any]


class ChangeEntropyEvaluator:
    """
    Evaluates the quantifiable entropy (risk) of a proposed change set.
    The evaluation is based on weighted metrics reflecting complexity and architectural fragility.
    
    The CEE consumes pre-extracted metrics (e.g., delta CC, dependency delta) 
    and maps them to a normalized risk score [0.0, 1.0].
    """

    COMPLEXITY_KEY: Final[str] = "complexity"
    FRAGILITY_KEY: Final[str] = "fragility"

    def __init__(self, gco_config: Dict[str, Any]):
        """
        Initializes CEE, loading and normalizing configuration weights.
        Configuration keys used: entropy_weights (complexity_factor, fragility_factor), 
        {COMPLEXITY_KEY}_threshold, {FRAGILITY_KEY}_high_risk_multiplier.
        """
        self.config = gco_config
        self.complexity_weight: float = 0.6
        self.fragility_weight: float = 0.4

        self._load_and_normalize_weights()

    def _load_and_normalize_weights(self) -> None:
        """Loads weights from config and ensures they sum to 1.0 for balanced risk calibration."""
        
        weights = self.config.get("entropy_weights", {})
        
        comp_w = weights.get("complexity_factor", 0.6)
        frag_w = weights.get("fragility_factor", 0.4)
        
        total = comp_w + frag_w
        
        if total > 0.0 and total != 1.0:
            self.complexity_weight = comp_w / total
            self.fragility_weight = frag_w / total
        elif total == 0.0:
            # Fallback for completely missing or zeroed config
            self.complexity_weight = 0.6
            self.fragility_weight = 0.4
        else:
            # Case where total is already 1.0
            self.complexity_weight = comp_w
            self.fragility_weight = frag_w


    def calculate_entropy(self, change_payload: Dict[str, Any], structural_report: Dict[str, Any]) -> float:
        """
        Calculates a quantifiable entropy score for the proposed change.
        
        Args:
            change_payload: Data payload containing proposed changes and pre-extracted metrics.
            structural_report: System-wide architecture and integrity data (GRS mapping).
        
        Returns:
            Quantifiable entropy score (0.0 to 1.0) for S-04 calibration.
        """
        
        complexity_result = self._assess_cyclomatic_complexity(change_payload)
        fragility_result = self._map_dependency_risk(change_payload, structural_report)
        
        complexity_score = complexity_result['score']
        fragility_score = fragility_result['score']
        
        # Weighted calculation
        entropy = (complexity_score * self.complexity_weight) + (fragility_score * self.fragility_weight)
        
        # Clamp the score to the [0.0, 1.0] range, ensuring output integrity
        return max(0.0, min(1.0, entropy))


    def _assess_cyclomatic_complexity(self, payload: Dict[str, Any]) -> RiskScoreMetrics:
        """
        Calculates the complexity risk score based on the delta of Cyclomatic Complexity (CC).
        
        Assumes 'delta_cc' is present in the 'metrics' sub-dictionary of the payload.
        """
        
        metrics = payload.get('metrics', {})
        delta_cc = metrics.get('delta_cc', 2.5) # Stub default, relies on StaticMetricExtractor
        
        risk_tolerance = self.config.get(f'{self.COMPLEXITY_KEY}_threshold', 10.0)
        
        # Score proportional to delta CC relative to the defined threshold
        score = min(1.0, delta_cc / risk_tolerance) 

        return {
            "score": score, 
            "reasoning_data": {
                "metric_key": "delta_cc",
                "metric_value": delta_cc,
                "risk_threshold_used": risk_tolerance
            }
        }


    def _map_dependency_risk(self, payload: Dict[str, Any], report: Dict[str, Any]) -> RiskScoreMetrics:
        """
        Analyzes coupling changes against system integrity goals and GRS mapping.
        High-risk architectural component interaction increases the fragility score.
        """
        
        metrics = payload.get('metrics', {})
        coupling_increase = metrics.get('dependency_delta', 0.2) # Stub default, relies on StaticMetricExtractor
        files_modified = payload.get('files_modified', [])
        
        # Identify high-risk zone interaction (e.g., touching core kernel files)
        is_high_risk_zone = any(f.startswith("src/core/kernel") for f in files_modified)
        
        # Configuration retrieval for risk amplification
        risk_multiplier = self.config.get(f'{self.FRAGILITY_KEY}_high_risk_multiplier', 1.5)
        base_scaling_factor = self.config.get(f'{self.FRAGILITY_KEY}_scaling_factor', 5.0)

        effective_multiplier = risk_multiplier if is_high_risk_zone else 1.0
        
        # Calculate risk based on coupling delta, scaling, and critical zone amplification
        fragility_risk_raw = coupling_increase * effective_multiplier * base_scaling_factor
        score = min(1.0, fragility_risk_raw)

        return {
            "score": score,
            "reasoning_data": {
                "metric_key": "dependency_delta",
                "metric_value": coupling_increase,
                "high_risk_interaction": is_high_risk_zone,
                "effective_multiplier": effective_multiplier
            }
        }