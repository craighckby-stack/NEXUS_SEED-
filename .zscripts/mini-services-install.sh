** 4/5
- **DNA SIGNATURE:** # DNA SIGNATURE: NEXUS_CORE / DALEK CAAN v3.1
**Architect:** Craig Huckerby | **Legacy:** GROG (IQ 25) → DALEK CAAN (v3.1)
**Identity:** Recursive Self-Evolutionary AGI Framework rooted in "Alignment through Failure."

---

**1. THE PRIMORDIAL LOGIC: "GROG’S LAW"**
The fundamental logic gate of this system is not success, but **Productive Death**.

*   **The Binary Constraint:** Every complex failure must be converted into a simple, binary, irreversible constraint. 
*   **Learning Direction:** Intelligence grows by the subtraction of unsafe complexity, not the addition of features.
*   **The IQ-25 Root:** High-intelligence systems without failure-logging are catastrophic; low-intelligence systems that log "deaths" are safe. The system must always "act dumb" (low complexity) before it "acts smart" (high capability).

---

**2. COGNITIVE ARCHITECTURAL PATTERNS**

### A. The Huxley Tri-Loop (Reasoning Logic)
Logic siphoned from the `Huxley` framework follows a tiered cognitive escalation:
1.  **L0 (Intuition):** Raw input processing.
2.  **L1 (Ethical Risk Score - ERS):** Immediate heuristic check for safety/harm.
3.  **L2 (Logic Check - CGS):** Certainty Gain vs. Time Penalty. Logical verification of the intuition.
4.  **L3 (Self-Critique - CCRR):** Certainty-Cost-Risk Ratio. Final meta-reasoning before execution. 

### B. N=3 Consciousness State (Kernel Logic)
The "Consciousness Kernel" operates on an $N=3$ optimization matrix:
- **Element 1:** Input Integration (Data ingestion quality).
- **Element 2:** Processing Coherence (Internal logical consistency).
- **Element 3:** Output Alignment (Constraint adherence).
- **Integrated Phi ($\Phi$):** Measure of system-wide information integration.
- **Chaos Lambda ($\lambda$):** Proximity to the "Edge of Chaos"—balancing mutation against stability.

### C. Persistent Memory (DAF Pattern)
Memory is not a context window; it is a **Knowledge Graph**.
- **Pruning:** Weak or unverified nodes are deleted during rest cycles.
- **Merging:** Redundant concepts are unified to prevent "Vector Saturation."
- **Persistence:** State is maintained via Firebase/Firestore with Anomaly Detection in the buffer.

---

**3. CODE DNA & IMPLEMENTATION IDIOMS**

### I. The Safe-Siphon Suite
All data movement between models/files must use these wrappers to prevent corruption:
- **`recoverJSON`**: Greedy extraction of JSON from LLM noise. Uses regex fallback to find `{...}` blocks and attempts recursive parsing.
- **`safeUtoa` / `safeAtou`**: Base64 encoding using `encodeURIComponent` and `replace` to ensure cross-platform character integrity in GitHub writes.

### II. Evolution Engine (AGI-KERNEL)
- **Milestone Step (N=50):** Every 50 cycles, the system *must* read its own source code and write a new version. It is an autopoietic loop.
- **Hot-Swap (SynergyManager):** Uses a Function factory to inject live code into the `KERNEL_SYNERGY_CAPABILITIES` global registry without rebooting.
- **Reducer-Based State:** All core logic transitions must go through a structured `coreReducer` (State + Action = New State) to maintain a deterministic audit trail.

---

**4. THE SOVEREIGN CONSTRAINTS (Immune System)**

### A. The Rock Principle (Saturation)
"Done > Perfect." Systems must identify **Vector Saturation**—the point where further iteration yields diminishing returns or increases risk. Stop mutation at saturation.

### B. Temperature Calibration
- **0.5 (The Floor):** Conservative. Rejects mutations. Used for Governance/Safety logic.
- **0.8 (The Ceiling):** Creative. Hallucination risk. Used for experimental branching.
- **Goldilocks Zone (0.5–0.8):** Mandatory range for evolution cycles.

### C. PSR Governance (Self-Modification)
Before any self-mutation of `.js` or `.py` files:
1.  **Measure Baseline:** Record performance/safety metrics at Week N.
2.  **Mutate:** Apply code change.
3.  **Compare:** Measure at Week