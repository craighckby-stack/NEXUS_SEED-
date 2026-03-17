# Helpers Directory

Helper functions and utilities.

## Categories

- String manipulation
- Array operations
- Date/time formatting
- Validation
- Formatting

## Example

```javascript
// helpers/format.js
export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

export function formatNumber(num) {
  return num.toLocaleString();
}
```
