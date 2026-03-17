# Source Code Directory

This directory contains the application source code.

## Structure

```
src/
├── components/    # React/Vue components
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── services/      # API services
├── constants/     # Application constants
└── types/         # TypeScript type definitions
```

## Usage

Currently using `index.html` as entry point. This directory is for future component-based architecture.

## Migration

To migrate to component-based architecture:
1. Create components in `src/components/`
2. Create hooks in `src/hooks/`
3. Update `index.html` to import from build output
4. Configure build tool (Vite, Webpack, etc.)
