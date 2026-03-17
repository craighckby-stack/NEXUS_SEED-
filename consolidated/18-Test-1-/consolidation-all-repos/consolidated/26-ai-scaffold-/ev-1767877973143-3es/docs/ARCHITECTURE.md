# Architecture Documentation: Dalek Linear Evolution (v1.1)

## System Overview

Dalek Linear Evolution (DLE) is an autonomous, goal-oriented optimization system designed to achieve maximal code efficiency through iterative, AI-driven refinement cycles. The architecture prioritizes low-latency processing, robust version control integration, and scalable persistence, ensuring that optimization itself is performed efficiently.

---

## 1. Core Components

### 1.1 Frontend Interface (The Console)
- **File**: `index.html`
- **Framework**: React 18 (via CDN, optimized for minimal bundle size)
- **State Management**: Segregated React Hooks (`useReducer` and Context for complex state)
- **Optimization Focus**:
    - Minimal bundle size and reliance on native browser APIs.
    - Highly optimized rendering pipeline; memoization utilized heavily to prevent unnecessary re-renders.

### 1.2 GitHub Integration (Version Control Module)
- **API**: GitHub REST API v3 / GraphQL (GraphQL preferred for efficient, targeted data fetching)
- **Authentication**: Personal Access Token (PAT)
- **Operations**: Branch creation, file reading, atomic commit creation.
- **Optimization Focus**:
    - **Conditional Requests**: Employing ETag headers to minimize redundant data transfer when fetching repository contents.
    - **Atomic Commits**: Grouping all file modifications into a single, comprehensive commit per cycle to minimize API calls and maintain history clarity.

### 1.3 Evolution Core (AI Engine)
- **Provider**: Google Gemini
- **Model**: `gemini-2.0-flash-exp` (Selected for its superior latency/performance trade-off)
- **Capabilities**:
    - **Metric-Driven Optimization**: Focus on quantifiable metrics (Time Complexity, Cyclomatic Complexity, Memory Footprint reduction).
    - **Resource Profiling**: Simulated assessment of code execution cost before committing changes.
    - **Bug Detection & Refinement Generation**: Automated suggestion and application of low-level performance improvements (e.g., algorithmic substitution, optimized data structures).

### 1.4 Data Persistence
- **Provider**: Firebase Firestore
- **Collections**:
    - `environments/{appId}/state`: Volatile application status.
    - `history/{appId}/cycles`: Detailed evolution records, including performance delta metrics and associated GitHub SHAs.
- **Optimization Focus**:
    - **Minimal Writes**: Batching Firestore updates to reduce operational overhead.
    - **Targeted Indexing**: Aggressive indexing strategy on primary lookup fields to ensure fast query times for history review.

---

## 2. High-Level Data Flow (Optimization Cycle)

This diagram illustrates the progression of a single optimization cycle (O-Cycle), emphasizing serial dependency.

```
User Trigger (Start Evolution)
    |
    +-----> 1. GitHub Integration (Fetch Code, Create Working Branch)
    |          |
    +-----> 2. Evolution Core Analysis
    |          |-----> 2a. Complexity Scoring (Baseline)
    |          |-----> 2b. Generate Optimized Code Block
    |          |-----> 2c. Metric Verification (Check for Net Improvement)
    |          |
    +-----> 3. Conditional Commit
    |          |-----> IF Improvement > Threshold: Commit Changes
    |          |-----> ELSE: Abort Cycle, Delete Branch
    |
    +-----> 4. Data Persistence (Store Cycle Metadata)
    |
Application State Update (Ready for next cycle)
```

---

## 3. State Management Segregation

Application state is highly segregated using dedicated React Contexts to minimize unnecessary component re-renders, a core optimization strategy for the Frontend.

| State Context | Variables | Purpose | Optimization Note |
| :--- | :--- | :--- | :--- |
| **Authentication** | `user`, `ghToken`, `geminiKey` | Credentials and access scope. | Tokens stored in isolated memory; retrieval is memoized. |
| **Execution Control** | `isRunning`, `isAutoLooping`, `currentCycle` | Control flow and real-time status display. | Minimal data footprint; rapid updates. |
| **History & Metrics** | `vaultData`, `metricDeltas` | Records of past evolution results and performance deltas. | Data fetched lazily upon navigation to history views. |

---

## 4. Security Considerations

The architecture is designed to handle highly sensitive credentials (GitHub PATs, Gemini Keys) with maximal ephemeral security measures.

1.  **Token Storage Strategy**
    *   GitHub PATs and Gemini Keys are held strictly in non-persistent memory (`useRef` or internal module closure scope) for the duration of the active session.
    *   Tokens are cleared immediately upon page refresh or application shutdown.

2.  **API Key Provisioning**
    *   Gemini API Key is requested from the user at runtime. This avoids storage risks associated with environmental variables or client-side configuration files.

3.  **Data Isolation**
    *   Firebase Firestore security rules enforce strict read/write restrictions based on the authenticated user ID (`appId`), ensuring cross-application data isolation and preventing unauthorized modification of evolution history.