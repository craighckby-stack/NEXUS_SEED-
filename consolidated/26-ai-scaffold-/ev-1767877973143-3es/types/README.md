# Types Directory

This directory centralizes all JSDoc type definitions (`@typedef`) and interfaces used throughout the project. Using these types ensures better code clarity, enables robust tooling (like VS Code type inference), and improves overall documentation quality.

## Definitions File

- `index.js`: The sole file containing all exported JSDoc type definitions.

## Usage Example

Types are used for annotations in function parameters and return values:

```javascript
/**
 * Processes a structured log entry.
 * 
 * @param {LogEntry} log - The structured log entry.
 * @returns {void}
 */
function addLog(log) {
  // Properties like 'time' and 'msg' benefit from type inference.
  console.log(`[${log.time}] ${log.msg}`); 
}
```

## Key Type Categories

### Core Structures

Types fundamental to the application workflow:

- **LogEntry**: Standard structure for application log messages (e.g., `time`, `msg`).
- **EvolutionCycle**: Data structure representing a full evolution cycle iteration.

### GitHub API Models

Structures used for interacting with and modeling data from the GitHub API:

- **GitHubFile**: Complete file object representation.
- **GitHubRef**: Git reference object (e.g., branch or tag pointer).
- **GitHubTree**: Git tree object (representing directory contents).
- **GitHubTreeItem**: Individual item/entry within a Git tree structure.