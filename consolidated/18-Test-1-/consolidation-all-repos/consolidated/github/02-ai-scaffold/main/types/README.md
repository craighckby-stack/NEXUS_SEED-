# Types Directory

Type definitions and interfaces.

## Files

- `index.js` - JSDoc type definitions

## Usage

```javascript
/**
 * @param {LogEntry} log - Log entry
 */
function addLog(log) {
  console.log(`[${log.time}] ${log.msg}`);
}
```

## Categories

- **LogEntry**: Log message structure
- **EvolutionCycle**: Evolution cycle data
- **GitHubFile**: GitHub file object
- **GitHubRef**: Git reference object
- **GitHubTree**: Git tree object
- **GitHubTreeItem**: Tree item object
