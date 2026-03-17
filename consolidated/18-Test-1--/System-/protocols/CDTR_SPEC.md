## CERTIFIED DEVIATION TRAJECTORY REPOSITORY (CDTR) SPECIFICATION

### 1.0 PURPOSE
CDTR defines the structure and protocol for cryptographically sound storage of historical PSEM output data. It serves as the single source of truth for deviation metrics ($\Delta$) across all state transitions, enabling evidence-based, adaptive tuning of the MPAM $\Delta_{Max}$ threshold, moving it from a statically defined variable to a statistically validated performance percentile.

### 2.0 DATA STRUCTURE (CDTR Entry)

Each successful PSEM execution (Post-S11) commits one entry to the CDTR Ledger. Fields must be signed (CRoT).

| Field | Type | Description |
|:---|:---|:---|
| `transition_id` | UUID | Unique identifier of the state transition ($\Psi_{N} \to \Psi_{N+1}$) provided by CSTL. |
| `timestamp` | UTC (S0) | Commitment time of the PSEM log entry. |
| `model_id` | String | Identifier of the DSE model that initiated the state change. |
| `s_predicted` | Float | Predicted utility value ($S_{Predicted}$) used as the baseline. |
| `s_actual` | Float | Observed, verified utility value ($S_{Actual}$) calculated at PSEM S2.3. |
| `deviation_absolute` | Float | Calculated absolute deviation ($\Delta$). |
| `delta_max_context` | Float | The value of $\Delta_{Max}$ active at the time of this transition. |
| `compliance_status` | Enum | [PASS, SOFT_FAIL (Trigger 3.1), HARD_FAIL (Trigger 3.2)] |
| `cals_log_ref` | Hash | Cryptographic hash reference to the associated CALS log subset. |

### 3.0 ACCESS & UTILITY

*   **MPAM Engine:** Periodically queries CDTR (rolling 1000 transitions minimum) to recalculate the dynamic $\Delta_{Max}$ threshold, typically set to the 95th percentile of certified $\Delta$ values.
*   **ACPE Board:** Utilizes the full historical CDTR dataset to diagnose systemic drift or axiomatic inconsistencies during mandatory reviews (PSEM 3.2).
*   **CFTM:** Reads statistical aggregations of CDTR to inform long-term trend analysis for core failure threshold calibration ($\epsilon$).