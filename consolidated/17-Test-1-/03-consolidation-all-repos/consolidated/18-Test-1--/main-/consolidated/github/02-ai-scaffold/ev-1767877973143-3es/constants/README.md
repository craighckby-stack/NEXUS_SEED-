# Constants Directory

Application-wide constants and configuration values.

## Files

- `index.js` - Main constants export

## Usage

```javascript
import { APP_NAME, EVOLUTION_CONFIG } from '../constants';

console.log(APP_NAME);
console.log(EVOLUTION_CONFIG.defaultCycles);
```

## Categories

- **App Config**: Name, version, description
- **Repository Config**: Owner, name, branch settings
- **Evolution Config**: Cycle limits, branch prefix
- **API Endpoints**: GitHub and Gemini URLs
- **Storage Keys**: LocalStorage key names
- **File Patterns**: Include/exclude patterns
- **Log Levels**: Debug, info, warning, error, success
