# Architecture Documentation

## System Overview

Dalek Linear Evolution is an autonomous code refinement system that uses AI to iteratively improve codebases.

## Core Components

### 1. Frontend Interface
- **File**: `index.html`
- **Framework**: React 18 (via CDN)
- **State Management**: React Hooks (useState, useEffect, useRef)
- **Styling**: Inline styles with dark theme

### 2. GitHub Integration
- **API**: GitHub REST API v3
- **Authentication**: Personal Access Token
- **Operations**:
  - Branch creation
  - File reading
  - Commit creation
  - Repository scanning

### 3. AI Engine
- **Provider**: Google Gemini
- **Model**: gemini-2.0-flash-exp
- **Capabilities**:
  - Code analysis
  - Bug detection
  - Optimization suggestions
  - Refactoring recommendations

### 4. Data Persistence
- **Provider**: Firebase Firestore
- **Collections**:
  - `artifacts/{appId}/public/data/linear_evolution`
- **Features**:
  - Real-time synchronization
  - Evolution history tracking
  - Cycle metadata storage

## Data Flow

```
User Input
    │
    ├─► GitHub API
    │   ├─ Create Branch
    │   ├─ Fetch Repository
    │   └─ Read Files
    │
    ├─► AI Engine
    │   ├─ Analyze Code
    │   ├─ Identify Issues
    │   └─ Generate Improvements
    │
    ├─► GitHub API
    │   ├─ Update Files
    │   └─ Create Commits
    │
    └─► Firebase
        └─ Store History
```

## State Management

### Application State
- `user`: Firebase auth state
- `logs`: Array of log entries
- `isRunning`: Boolean - evolution in progress
- `isAutoLooping`: Boolean - multi-cycle mode
- `ghToken`: String - GitHub authentication
- `vaultData`: Array - evolution history

## Security Considerations

1. **Token Storage**
   - GitHub tokens stored in memory only
   - No local persistence
   - Cleared on page refresh

2. **Firebase Config**
   - Configurable per deployment
   - Should use environment variables in production

3. **API Keys**
   - Gemini key prompted at runtime
   - Not stored or logged
