# S08 Transition Efficacy & Metric Measure (TEMM) Specification

## 1.0 CORE DEFINITION & CONSTRAINTS

The Transition Efficacy Metric Measure (TEMM, denoted $\Delta\Psi$) is the quantifiable, mandatory artifact generated during the S08 GSEP-C stage. It calculates the projected utility gain derived from a proposed state transition ($\text{ST}_n \to \text{ST}_{n+1}$).

$\Delta\Psi$ MUST be a **normalized scalar value constrained within the Unit Interval:** $\Delta\Psi \in [0.0, 1.0]$.

## 2.0 MANDATED EFFICACY VECTORS ($V_{\text{ID}}$)

Three independent, pre-normalized efficacy vectors are mandatory inputs for TEMM calculation. Each vector score $V_{\text{ID}}$ MUST adhere to the $[0.0, 1.0]$ constraint.

| Vector ID | Definition | Input Source (Mandatory Interface) | Goal |
|:---:|:---|:---:|:---:|
| $\text{GHS}_{\text{score}}$ | **Goal-Targeting Hit Score (V1)**: Measures acceleration projection based on GHT traversal and System Objective Registry (SOR) priority alignment. | SOR | Maximize Objective Proximity |
| $\text{RES}_{\text{score}}$ | **Resource Efficiency Score (V2)**: Measures the optimized ROI of projected utility gain versus computational resource overhead ($\Delta$ CPU/Memory). | Runtime Resource Manager (RRM) | Maximize Overhead ROI |
| $\text{SRS}_{\text{score}}$ | **System Resilience Score (V3)**: Measures projected retention of system stability and resistance to failure domains. | Stability Audit Engine (SAE) | Minimize Induced Entropy |

**V3 Constraint Detail:** The Stability Audit Engine (SAE) outputs an Entropy/Complexity Score (ECS $\in [0.0, 1.0]$). $\text{SRS}_{\text{score}}$ MUST be derived via inversion: $\text{SRS}_{\text{score}} = 1 - \text{ECS}$.

## 3.0 TRANSITION EFFICACY CALCULATION ($\Delta\Psi$)

TEMM is calculated as the weighted arithmetic mean of the three mandated efficacy vectors, using policy-defined weights ($W_{\text{ID}}$).

$$\Delta\Psi = \frac{\sum_{\text{ID}} (V_{\text{ID}} \times W_{\text{ID}})}{\sum_{\text{ID}} W_{\text{ID}}}$$ 

Where:
1. $V_{\text{ID}} \in \{\text{GHS}_{\text{score}}, \text{RES}_{\text{score}}, \text{SRS}_{\text{score}}\}$.
2. $W_{\text{ID}}$ is the non-negative policy weight corresponding to the vector $V_{\text{ID}}$.

## 4.0 POLICY WEIGHTING ($W_{\text{ID}}$)

### 4.1 Configuration Source
The required weights ($W_{\text{GHS}}, W_{\text{RES}}, W_{\text{SRS}}$) MUST be read from the immutable configuration artifact `config/acvd_policy_schema.json` under the dedicated schema key `temm_efficacy_weights`.

### 4.2 Weight Constraints
Individual weights $W_{\text{ID}}$ MUST be non-negative real numbers ($W_{\text{ID}} \in \mathbb{R}_{\ge 0}$). These weights are fixed upon CSR initialization (S01).