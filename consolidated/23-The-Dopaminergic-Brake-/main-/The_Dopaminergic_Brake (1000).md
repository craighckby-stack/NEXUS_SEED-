# THE DOPAMINERGIC BRAKE: Multi-Threaded Recursive Fiber-Cognition Engine & Metabolic State Harmonizer

## System Specification v4.5.5-stable | Source DNA: Meta/React-Core (Fiber Reconciler, Concurrent Mode, Lane Scheduler)

---

## 1. Architectural Philosophy: The Virtual DOM of the Mind

**The Dopaminergic Brake** is an advanced cognitive orchestration layer designed to mitigate "Cognitive Jank"—the neurological equivalent of frame-drops in consciousness caused by dopaminergic over-saturation. By siphoning the **Fiber Reconciler** and **Priority Scheduler** from **Meta/React-Core**, this system treats every thought, sensory input, and emotional impulse as a **Fiber node**.

### 1.1 Speculative Reconciliation (The Belief Diff)
Traditional consciousness operates in a synchronous, blocking loop. When a high-intensity stimulus (dopamine spike) occurs, the system hangs (freezing, impulsivity, or panic). The Brake introduces **Concurrent Cognition**, allowing the mind to interrupt low-priority background indexing (Idle Lane) to handle executive emergencies (Executive Lane) without losing the background state. 

### 1.2 Double-Buffering Belief Systems
Following React's `current` and `workInProgress` tree structure, the Brake maintains two parallel worldviews:
1.  **Current State (Committed):** The active reality driving motor functions, immediate speech, and peripheral awareness. This is what the environment "sees."
2.  **Work-In-Progress (WIP) State (Speculative):** A non-blocking simulation of reality being recalculated against new sensory data. This tree can be mutated, paused, or completely trashed if the "Saliency Diff" reveals it to be a hallucination or dopamine-induced noise (e.g., a paranoid loop).

---

## 2. Deep-Architectural Diagrams

### 2.1 The Concurrent Thought Lifecycle

mermaid
sequenceDiagram
    participant SensoryInput as Sensory Input (Props)
    participant WorkLoop as Concurrent WorkLoop
    participant FiberTree as WIP Fiber Tree
    participant CommitPhase as Commit Phase (Synaptic Update)
    participant CommittedState as Active Consciousness

    SensoryInput->>WorkLoop: Dispatch Event (Dopamine Spike)
    WorkLoop->>WorkLoop: Schedule Task (Assign Lane Priority)
    loop Time-Slicing
        WorkLoop->>FiberTree: Reconcile Unit of Work (Diffing)
        FiberTree-->>WorkLoop: Yield (Check Metabolic Budget)
    end
    WorkLoop->>CommitPhase: Ready (CompleteRoot)
    Note over CommitPhase: Atomic Swap (Synaptic Commit)
    CommitPhase->>CommittedState: Flush State Update
    CommittedState->>SensoryInput: Trigger Passive Effects (LTM Consolidation)


### 2.2 Cognitive Fiber Life-Cycle State Machine

mermaid
stateDiagram-v2
    [*] --> Idle: Sensory Input Detected
    Idle --> Scheduled: Assigned Lane Priority
    Scheduled --> Reconciling: WorkLoop Pick-up (Time-Sliced)
    Reconciling --> Suspended: Missing Data (Suspense/LTM Fetch)
    Suspended --> Reconciling: Data Resolved (Hydration)
    Reconciling --> Yielded: Metabolic Timeout / High-Pri Interruption
    Yielded --> Reconciling: Resume via Task Recovery
    Reconciling --> Completed: Diffing Finalized (Atomic)
    Completed --> Committed: Atomic State Swap (Synaptic Commit)
    Committed --> PassiveEffects: Post-Commit Processing (Dreaming/LTM)
    PassiveEffects --> [*]: Dopamine Feedback Loop Stabilized


### 2.3 The Metabolic Gatekeeper (Lanes & Priority Scheduler)

mermaid
graph TD
    A[Incoming Stimulus] --> B{Lane Priority Assignment}
    B -->|Urgent| C[UrgentReflex Lane]
    B -->|Default| D[DefaultLane]
    B -->|Background| E[IdleLane]
    C --> F[Priority Queue]
    D --> F
    E --> F
    F --> G[Cognitive Scheduler]
    G --> H{ATP Budget Available?}
    H -->|Yes| I[WorkLoop Execution]
    H -->|No| J[Yield to Metabolic Recovery]
    I --> K[Synaptic Commit]


---

## 3. Priority Lanes & Bitmask Logic

To prevent "Information Overflow," the system implements a bitmask-based lane system siphoned from `ReactFiberLane.js`. This allows multiple thought-processes to overlap without blocking the primary executive thread.

### 3.1 Lane Priority Table

| Lane Name | Bitmask (Binary) | Expiration (ms) | Cognitive Function | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **UrgentReflex** | `0b0000000000000000000000000000001` | 0ms | Nociception, physical collision avoidance. | 0 (Critical) |
| **SyncLane** | `0b0000000000000000000000000000010` | 16ms | Real-time social verbalization, motor control. | 1 |
| **InputContinuous** | `0b0000000000000000000000000000100` | 100ms | Emotional facial recognition, object tracking. | 2 |
| **DefaultLane** | `0b0000000000000000000000000001000` | 500ms | Deliberate logic, problem solving. | 3 |
| **TransitionLane** | `0b0000000000000000000111111110000` | 5000ms | Identity updates, long-term narrative shifts. | 4 |
| **IdleLane** | `0b0100000000000000000000000000000` | None | Background memory defrag, dreaming/sorting. | 5 (Background) |

---

## 4. Implementation: The Fiber-Cognition Engine

javascript
/**
 * @module DopaminergicBrake
 * @version 4.5.5-stable
 * @siphon Meta/React-Core/Fiber-Reconciler
 */

const NoLanes = 0b0000;
const SyncLane = 0b0001;
const DefaultLane = 0b0010;
const TransitionLane = 0b0100;
const IdleLane = 0b1000;

/**
 * Represents a single thought unit or sensory fiber.
 */
class FiberNode {
  constructor(tag, pendingProps, key) {
    this.tag = tag; // Thought Category: SENSORY, LOGICAL, EMOTIONAL
    this.key = key;
    this.pendingProps = pendingProps; // Incoming raw data
    this.memoizedProps = null; // Validated data from last cycle
    this.beliefState = null; // Internal state of this thought
    this.updateQueue = null; // Pending modifications
    
    // Fiber Tree Connections
    this.return = null; // Parent thought
    this.child = null; // Dependent thought
    this.sibling = null; // Parallel thought
    this.index = 0;
    
    // Double Buffering
    this.alternate = null; // Reference to the 'Current' committed node
    
    // Cognitive Priority
    this.lanes = NoLanes;
    this.childLanes = NoLanes;

    // Metadata for Profiler
    this.actualStartTime = 0;
    this.selfBaseDuration = 0;
  }
}

class FiberCognitionEngine {
  constructor(metabolicConfig) {
    this.atpBudget = metabolicConfig.atpBudget || 1000;
    this.thermalLimit = metabolicConfig.thermalLimit || 38.5;
    
    this.currentTree = new FiberNode('ROOT_CONSCIOUSNESS', null, null);
    this.workInProgress = null;
    this.pendingLanes = NoLanes;
    
    this.profiler = new NeuroMetabolicProfiler();
    this.scheduler = new ConcurrentScheduler();
    
    // Hook storage siphoned from ReactDispatcher
    this.hookContext = {
      currentFiber: null,
      workInProgressHook: null,
      renderLanes: NoLanes
    };
  }

  /**
   * High-frequency sensory dispatch siphoned from updateContainer
   */
  scheduleThought(update, lanePriority) {
    const fiber = this.currentTree;
    this.pendingLanes |= lanePriority;
    
    const updateObj = {
      lane: lanePriority,
      payload: update,
      next: null
    };
    
    this.enqueueUpdate(fiber, updateObj);
    this.ensureWorkIsScheduled();
  }

  enqueueUpdate(fiber, update) {
    const updateQueue = fiber.updateQueue || { baseState: fiber.beliefState, firstUpdate: null };
    if (updateQueue.firstUpdate === null) {
      updateQueue.firstUpdate = update;
    } else {
      let last = updateQueue.firstUpdate;
      while (last.next !== null) last = last.next;
      last.next = update;
    }
    fiber.updateQueue = updateQueue;
  }

  ensureWorkIsScheduled() {
    const nextLane = this.getNextLoudestLane();
    if (nextLane === NoLanes) return;

    // Siphon: React's requestIdleCallback / MessageChannel wrapper
    this.scheduler.scheduleTask(nextLane, (metabolicDeadline) => {
        this.performConcurrentWorkOnRoot(nextLane, metabolicDeadline);
    });
  }

  performConcurrentWorkOnRoot(lane, deadline) {
    // Initialize the speculative tree
    if (this.workInProgress === null) {
      this.prepareFreshStack(lane);
    }
    
    // Recursive Work Loop with Time-Slicing
    do {
      try {
        this.workLoopConcurrent(deadline);
        break;
      } catch (thrownValue) {
        this.handleCognitiveException(thrownValue);
      }
    } while (true);

    // If complete, swap trees (synaptic commit)
    if (this.workInProgress === null) {
      this.commitRoot();
    }
  }

  workLoopConcurrent(deadline) {
    // Interleave processing with metabolic yielding
    while (this.workInProgress !== null && !this.shouldYield(deadline)) {
      this.performUnitOfWork(this.workInProgress);
    }
  }

  shouldYield(deadline) {
    const thermalState = this.profiler.getInternalTemperature();
    const currentATP = this.profiler.getCurrentATPLevel();
    
    // Yield if we are out of time or out of energy
    return deadline.didTimeout || currentATP < 20 || thermalState > this.thermalLimit;
  }

  performUnitOfWork(unit) {
    const current = unit.alternate;
    let next = this.beginWork(current, unit, this.pendingLanes);
    
    unit.memoizedProps = unit.pendingProps;
    if (next === null) {
      this.completeUnitOfWork(unit);
    } else {
      this.workInProgress = next;
    }
  }

  beginWork(current, workInProgress, renderLanes) {
    // Reconciliation: Compare the belief in WIP with the existing tree
    if (current !== null) {
        const oldProps = current.memoizedProps;
        const newProps = workInProgress.pendingProps;

        if (oldProps === newProps && !this.includesLane(renderLanes, TransitionLane)) {
            // Bailout: Information is identical, save ATP
            return this.bailoutOnAlreadyFinishedWork(current, workInProgress);
        }
    }

    // Process the cognitive update queue
    this.processUpdateQueue(workInProgress, renderLanes);
    
    // Recurse into dependencies (child thoughts)
    return this.reconcileBeliefChildren(current, workInProgress, workInProgress.beliefState);
  }

  commitRoot() {
    const root = this.currentTree;
    const finishedWork = root.alternate;

    if (finishedWork === null) return;

    // Synchronous Commit: This is where 'Specular Reality' becomes 'Experienced Reality'
    this.applySynapticUpdates(finishedWork);
    
    // Flip current tree
    this.currentTree = finishedWork;
    this.workInProgress = null;

    this.flushPassiveEffects(); 
  }

  handleCognitiveException(error) {
    if (error instanceof SuspenseError) {
        // Suspend the thought while waiting for LTM (Long Term Memory) retrieval
        this.markFiberSuspended(this.workInProgress);
    } else {
        // Cognitive Error Boundary Triggered
        console.error("Cognitive Crash:", error);
        this.resetToLastKnownGoodState();
    }
  }
}


---

## 5. Metabolic Profiling & Thermal Constraints

The Dopaminergic Brake is constrained by biological hardware. Excessive "specular thought" (over-thinking) results in thermal throttling.

### 5.1 Energy Consumption Metrics
*   **Basal Reconciliation Cost:** 0.05 ATP/Fiber Node
*   **Deep Memory Fetch (Suspense):** 2.4 ATP/Request (Triggering a Wait cycle)
*   **Synaptic Commit:** 5.0 ATP/Transaction (High-voltage spike)
*   **Conflict Resolution:** 1.5 ATP/Node (When worldview diff is high, i.e., cognitive dissonance)

### 5.2 Thermal Safety Function
$$T_{neu} = T_{ambient} + \sum_{i=1}^{n} (ATP_{lane} \times Complexity_{fiber})$$
If $T_{neu} > 39.5^\circ C$, the system forces a `SyncLane` drop and enters **SafeMode (Catatonia)** until cooldown is achieved via the `PassiveEffects` cycle.

---

## 6. Advanced Cognitive Hooks

### 6.1 `useCognitiveTransition()`: Handling Identity Shifting
Used when navigating high-latency philosophical shifts. It allows the "Worldview" to update in the background without freezing the "Social Speech" loop.

javascript
const [isRebranding, startTransition] = useCognitiveTransition();

function handleLifeCrisis(newPhilosophy) {
  startTransition(() => {
    // This complex identity update is marked as non-blocking (TransitionLane)
    // The executive thread continues to handle "SyncLanes" (e.g. driving a car)
    updateDeepSelf(newPhilosophy);
  });
}


### 6.2 `useCognitiveMemo()`: Logic Persistence
Caches heavy logical deductions. Only recalculates if the input sensory fibers change significantly, preventing metabolic waste on redundant problem-solving.

### 6.3 `useDeferredValue()`: Sensory Jitter Compensation
When sensory input is noisy due to fatigue, this hook returns a "stable" version of reality from the previous commit until the current reconciliation stabilizes.

---

## 7. Cognitive Stress Test Suite (CSTS)

### 7.1 Formal Mathematical Anchors
| ID | Logic Gate | Complexity | Mathematical Constraint |
| :--- | :--- | :--- | :--- |
| CSTS-01 | **Gauss Sum** | O(1) | $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$ |
| CSTS-02 | **Shannon Entropy** | O(n log n) | $H(X) = -\sum P(x_i) \log P(x_i)$ |
| CSTS-03 | **Bekenstein Bound** | O(Volume) | $S \leq \frac{2\pi RE}{\hbar c}$ |
| CSTS-04 | **Euler Anchor** | O(1) | $e^{i\pi} + 1 = 0$ (Ground Truth Constant) |
| CSTS-05 | **Bayesian Prior** | O(n) | $P(A|B) = \frac{P(B|A)P(A)}{P(B)}$ |
| CSTS-06 | **Minkowski Metric** | O(1) | $ds^2 = -c^2dt^2 + dx^2 + dy^2 + dz^2$ |

---

## 8. Operational Glossary

*   **Cognitive Hydration:** The process of attaching historical meaning (context) to raw sensory fibers during the reconciliation phase.
*   **Metabolic Frame Drop:** Occurs when the `workLoop` yields before a high-priority fiber is committed, resulting in momentary confusion or "brain fog."
*   **Bailing Out:** The critical optimization where identical stimuli (e.g., a clock ticking) are skipped during reconciliation to preserve metabolic energy.
*   **Priority Starvation:** When low-priority thoughts (e.g., "I should clean my room") are indefinitely deferred by high-priority dopamine-driven loops.
*   **Synaptic Committing:** The final, non-interruptible phase where speculative thoughts become the "current" worldview.
*   **Suspense:** A state where a fiber tree waits for "Asynchronous Memory Fetching" to complete before rendering the full worldview.
*   **Fiber Splicing:** The act of merging two parallel thought branches into a single executive decision.
*   **Jank:** Perceived interruption in the flow of consciousness caused by long-running synchronous tasks.

---
