import logging
from typing import List, Dict, Any, Tuple
import numpy as np

# Assuming interfaces/ABCs for RGCM and STHL exist externally for type clarity
# Placeholders for required APIs
class TrustConfigurationAPI: pass
class SourceTrustHistoryLedgerAPI: pass

logger = logging.getLogger(__name__)

class TelemetryConsensusAndReconciliationModule:
    """
TCRM: Ensures high-integrity consensus among diverse, redundant telemetry providers.
Uses robust statistical methods (e.g., Weighted Median Absolute Deviation - WMAD) 
to mitigate sensor drift, input deviation, and manipulation before TIAR attestation 
is locked for critical execution gates (P-01, etc.).
    """
    
    REQUIRED_FIELDS = ['source_id', 'timestamp', 'value', 'integrity_hash'] 
    STATISTICAL_SCALING_FACTOR = 1.4826 # Standard conversion factor for MAD to Std Dev equivalent

    def __init__(self, trust_config: Dict, rgcm_api: TrustConfigurationAPI, sthl_api: SourceTrustHistoryLedgerAPI = None):
        self.config = trust_config
        self.rgcm = rgcm_api
        self.sthl = sthl_api 
        self.reconciliation_method = trust_config.get('reconciliation_method', 'WMAD')
        self.min_required_sources = self.config.get('min_required_sources', 2)
        self.divergence_threshold = self._load_threshold()

    def _load_threshold(self) -> float:
        """Attempts to load the critical divergence threshold from RGCM, falling back to configuration."""
        try:
            threshold = self.rgcm.get_parameter('S0X_DIVERGENCE_MAX')
            if not isinstance(threshold, (int, float)) or threshold <= 0:
                 raise ValueError("RGCM returned invalid threshold.")
            return float(threshold)
        except Exception as e:
            fallback = self.config.get('default_divergence_max', 0.05)
            logger.warning(f"RGCM parameter fetch or validation failed ({type(e).__name__}). Using local fallback: {fallback}")
            return fallback

    @staticmethod
    def _calculate_weighted_median(values: np.ndarray, weights: np.ndarray) -> float:
        """Calculates the weighted median of a 1D NumPy array. Requires NumPy."""
        if values.size == 0:
            raise ValueError("Cannot calculate median on empty data.")
            
        # Ensure weights are normalized to sum to 1
        normalized_weights = weights / np.sum(weights)

        # Sort based on values
        sorted_indices = np.argsort(values)
        sorted_values = values[sorted_indices]
        sorted_weights = normalized_weights[sorted_indices]
        cumulative_weights = np.cumsum(sorted_weights)
        
        # Find the index where cumulative weight crosses 0.5
        median_index = np.where(cumulative_weights >= 0.5)[0][0]
        
        return sorted_values[median_index]

    def _get_source_weights(self, source_ids: List[str]) -> Dict[str, float]:
        """Retrieves dynamic weights from STHL, ensuring weights are normalized and robust against zero scores."""
        
        weights = {}
        # Use a small epsilon (0.001) to prevent sources with score 0.0 from breaking calculation
        MIN_WEIGHT = 0.001 

        if self.sthl:
            weights = {sid: max(self.sthl.get_current_trust_score(sid), MIN_WEIGHT) 
                       for sid in source_ids}
        else:
            # Default: Equal weighting if STHL is unavailable
            weights = {sid: 1.0 for sid in source_ids}
            
        total_score = sum(weights.values())
        
        if total_score == 0:
            # Fallback for numerical instability, revert to uniform weighting
            N = len(source_ids)
            return {sid: 1.0 / N for sid in source_ids}

        # Normalize weights
        return {k: v / total_score for k, v in weights.items()}

    def _validate_input(self, data: Dict) -> bool:
        """Validates schema integrity and checks for cryptographic integrity."""
        source_id = data.get('source_id', 'UNKNOWN')
        
        if not all(field in data for field in self.REQUIRED_FIELDS):
            logger.error(f"Integrity failure (Schema). Missing fields in data from {source_id}.")
            return False
        
        # Ensure the 'value' is numeric early
        try:
            data['value'] = float(data['value']) # Convert to float immediately for consistent processing
        except (ValueError, TypeError):
             logger.error(f"Integrity failure (Type). 'value' is not numeric for source {source_id}.")
             return False
        
        # Placeholder for deeper cryptographic verification
        # if not self._verify_data_integrity(...): return False
        
        return True

    def _dispatch_reconciliation(self, valid_data: List[Dict]) -> Tuple[bool, float, float]:
        """Dispatches the appropriate reconciliation logic based on configuration."""
        if self.reconciliation_method == 'WMAD':
            return self._calculate_wmad_consensus(valid_data)
        else:
            # Future expansion or misconfiguration handler
            raise NotImplementedError(f"Reconciliation method '{self.reconciliation_method}' is not implemented.")

    def _calculate_wmad_consensus(self, data_list: List[Dict]) -> Tuple[bool, float, float]:
        """
        Applies the Weighted Median Absolute Deviation (WMAD) to determine coherence.
        """
        source_ids = [d['source_id'] for d in data_list]
        values = np.array([d['value'] for d in data_list])
        
        weights_dict = self._get_source_weights(source_ids)
        weight_list = np.array([weights_dict[sid] for sid in source_ids])

        # 1. Accepted Value (Robust Central Tendency)
        accepted_value = self._calculate_weighted_median(values, weight_list)
        
        # 2. Robust Spread (WMAD Calculation)
        deviations = np.abs(values - accepted_value)
        weighted_mad = self._calculate_weighted_median(deviations, weight_list)

        robust_spread = self.STATISTICAL_SCALING_FACTOR * weighted_mad

        # Metric: Calculate relative divergence unless accepted_value is near zero
        if abs(accepted_value) > 1e-6:
            metric = robust_spread / abs(accepted_value) 
        else:
            metric = robust_spread 

        is_consensus = (metric <= self.divergence_threshold)
            
        return is_consensus, metric, accepted_value

    def _update_sthl(self, valid_data: List[Dict], is_consensus: bool, metric: float, accepted_value: float):
        """Helper to manage trust ledger updates."""
        if self.sthl:
            for data in valid_data:
                self.sthl.update_score_on_reconciliation(
                    source_id=data['source_id'],
                    success=is_consensus,
                    divergence_metric=metric,
                    consensus_median=accepted_value
                )

    def resolve_consensus(self, telemetry_inputs: List[Dict]) -> Dict:
        """
        Calculates consensus and returns a structured decision and diagnostic report.
        :param telemetry_inputs: A list of dicts, where each dict is data from one telemetry provider.
        :return: Consensus Report structure.
        """
        report = {
            "consensus_achieved": False,
            "accepted_value": None,
            "divergence_metric": None,
            "diagnostic_status": "PENDING",
            "failed_sources": []
        }
        
        # 1. Integrity Check and Filtering
        valid_data = []
        for data in telemetry_inputs:
            if self._validate_input(data):
                valid_data.append(data)
            else:
                source_id = data.get('source_id', 'UNKNOWN_SOURCE')
                report["failed_sources"].append(source_id)
                if self.sthl:
                    self.sthl.record_integrity_failure(source_id)

        if len(valid_data) < self.min_required_sources:
            report["diagnostic_status"] = (f"FAILURE: Insufficient valid telemetry sources "
                                          f"({len(valid_data)} < {self.min_required_sources}).")
            logger.warning(report["diagnostic_status"])
            return report

        # 2. Semantic Reconciliation (Divergence Check)
        try:
            is_consensus, metric, accepted_value = self._dispatch_reconciliation(valid_data)
        except Exception as e:
            logger.critical(f"Consensus calculation failed due to implementation error: {e}")
            report["diagnostic_status"] = f"CRITICAL FAILURE: Consensus calculation crashed. ({type(e).__name__})"
            return report
        
        report["accepted_value"] = accepted_value
        report["divergence_metric"] = metric
        report["consensus_achieved"] = is_consensus

        # 3. Post-Consensus Trust Update
        self._update_sthl(valid_data, is_consensus, metric, accepted_value)

        if is_consensus:
            report["diagnostic_status"] = "SUCCESS: Telemetry reconciled within tolerance."
            logger.info(f"Consensus achieved. Value: {accepted_value:.4f}, Metric: {metric:.4f}")
        else:
            report["diagnostic_status"] = "FAILURE: Telemetry divergence exceeds allowed threshold."
            logger.error(f"Divergence detected! Metric: {metric:.4f} > Threshold: {self.divergence_threshold:.4f}")
        
        return report
