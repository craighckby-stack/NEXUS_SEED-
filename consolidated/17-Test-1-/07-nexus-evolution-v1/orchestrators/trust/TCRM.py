import logging
from typing import List, Dict, Any, Tuple
import numpy as np

# Placeholders for required APIs (Assuming these interfaces exist)
class TrustConfigurationAPI: pass
class SourceTrustHistoryLedgerAPI: pass

logger = logging.getLogger(__name__)

class TelemetryConsensusAndReconciliationModule:
    """
TCRM: Ensures high-integrity consensus among diverse, redundant telemetry providers.
Uses robust statistical methods (e.g., Weighted Median Absolute Deviation - WMAD)
for highly efficient consensus determination.
    """
    
    REQUIRED_FIELDS = ['source_id', 'timestamp', 'value', 'integrity_hash'] 
    # Standard conversion factor for MAD to Std Dev equivalent (for robust scale estimation)
    STATISTICAL_SCALING_FACTOR = 1.4826 

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
        """
        Core computational primitive: Calculates the weighted median of a 1D NumPy array.
        Optimized using sorting and cumulative sums (O(N log N)).
        """
        if values.size == 0:
            raise ValueError("Cannot calculate median on empty data.")
            
        # 1. Normalize weights
        normalized_weights = weights / np.sum(weights)

        # 2. Sort data based on values
        sorted_indices = np.argsort(values)
        sorted_values = values[sorted_indices]
        sorted_weights = normalized_weights[sorted_indices]
        
        # 3. Calculate cumulative weights
        cumulative_weights = np.cumsum(sorted_weights)
        
        # 4. Find the index where cumulative weight crosses 0.5 using efficient searchsorted
        median_index = np.searchsorted(cumulative_weights, 0.5)
        
        # Handle edge case where searchsorted might return array length if 0.5 isn't reached (shouldn't happen with normalized weights)
        if median_index >= len(sorted_values):
             median_index = len(sorted_values) - 1
             
        return sorted_values[median_index]

    def _get_source_weights(self, source_ids: List[str]) -> Dict[str, float]:
        """Retrieves dynamic weights from STHL and ensures normalization/robustness."""
        
        weights = {}
        MIN_WEIGHT = np.finfo(float).eps * 10 # Use NumPy epsilon for robustness

        if self.sthl:
            weights = {sid: max(self.sthl.get_current_trust_score(sid), MIN_WEIGHT) 
                       for sid in source_ids}
        else:
            # Default: Equal weighting if STHL is unavailable
            weights = {sid: 1.0 for sid in source_ids}
            
        total_score = sum(weights.values())
        N = len(source_ids)

        if total_score == 0 or N == 0:
            # Fallback to uniform weighting if total score is zero or input is empty
            uniform_weight = 1.0 / N if N > 0 else 0.0
            return {sid: uniform_weight for sid in source_ids}

        # Normalize weights
        return {k: v / total_score for k, v in weights.items()}

    def _validate_input(self, data: Dict) -> bool:
        """Validates schema integrity and checks type casting early."""
        source_id = data.get('source_id', 'UNKNOWN')
        
        if not all(field in data for field in self.REQUIRED_FIELDS):
            logger.error(f"Integrity failure (Schema). Missing fields in data from {source_id}.")
            return False
        
        # Convert 'value' to float immediately and robustly
        try:
            data['value'] = np.float64(data['value']) 
        except (ValueError, TypeError):
             logger.error(f"Integrity failure (Type). 'value' is not numeric for source {source_id}.")
             return False
        
        return True

    def _prepare_data_arrays(self, valid_data: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepares aligned NumPy arrays for calculation to maximize efficiency."""
        source_ids = [d['source_id'] for d in valid_data]
        
        # Extract values (using generator/list comprehension is fast for conversion)
        values = np.array([d['value'] for d in valid_data], dtype=np.float64)
        
        # Fetch weights based on IDs
        weights_dict = self._get_source_weights(source_ids)
        weights = np.array([weights_dict[sid] for sid in source_ids], dtype=np.float64)
        
        return values, weights

    def _calculate_robust_consensus_metrics(self, values: np.ndarray, weights: np.ndarray) -> Tuple[bool, float, float]:
        """
        Calculates Robust Central Tendency (WM) and Robust Scale (WMAD).
        Abstracts the core WMAD reconciliation process.
        """
        
        # 1. Robust Central Tendency (R1): Recursive call to the core primitive
        accepted_value = self._calculate_weighted_median(values, weights)
        
        # 2. Calculate Absolute Deviations
        deviations = np.abs(values - accepted_value)
        
        # 3. Robust Scale Estimation (R2): Recursive call on deviations
        weighted_mad = self._calculate_weighted_median(deviations, weights)

        robust_spread = self.STATISTICAL_SCALING_FACTOR * weighted_mad

        # 4. Metric calculation: Calculate relative divergence (or absolute if near zero)
        # Use robust check against floating point zero
        if abs(accepted_value) > np.finfo(float).eps * 100:
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
        Calculates consensus using the configured robust statistical method.
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

        # 2. Data Alignment and Weighting (Preparation stage)
        try:
            values, weights = self._prepare_data_arrays(valid_data)
        except Exception as e:
             logger.critical(f"Data preparation failed: {e}")
             report["diagnostic_status"] = "CRITICAL FAILURE: Data array preparation crashed."
             return report

        # 3. Semantic Reconciliation (Divergence Check) - Highly Abstracted Call
        try:
            if self.reconciliation_method == 'WMAD':
                is_consensus, metric, accepted_value = self._calculate_robust_consensus_metrics(values, weights)
            else:
                raise NotImplementedError(f"Reconciliation method '{self.reconciliation_method}' is not implemented.")
        except Exception as e:
            logger.critical(f"Consensus calculation failed due to implementation error: {e}")
            report["diagnostic_status"] = f"CRITICAL FAILURE: Consensus calculation crashed. ({type(e).__name__})"
            return report
        
        report["accepted_value"] = accepted_value
        report["divergence_metric"] = metric
        report["consensus_achieved"] = is_consensus

        # 4. Post-Consensus Trust Update
        self._update_sthl(valid_data, is_consensus, metric, accepted_value)

        if is_consensus:
            report["diagnostic_status"] = "SUCCESS: Telemetry reconciled within tolerance."
            logger.info(f"Consensus achieved. Value: {accepted_value:.4f}, Metric: {metric:.4f}")
        else:
            report["diagnostic_status"] = "FAILURE: Telemetry divergence exceeds allowed threshold."
            logger.error(f"Divergence detected! Metric: {metric:.4f} > Threshold: {self.divergence_threshold:.4f}")
        
        return report