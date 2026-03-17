# Source Code Directory (src/)

This directory is dedicated to the modular, performance-optimized source code base. We mandate strict use of TypeScript and modern build practices (e.g., tree-shaking, code splitting) to ensure minimal bundle size and fast load times.

## Structure and Modularity

The structure enforces Separation of Concerns, which is crucial for maximizing tree-shaking effectiveness and developer velocity.

```
src/
├── components/    # Reusable UI elements (focused on rendering performance)
├── hooks/         # Custom logic (optimized for minimal re-renders)
├── utils/         # Pure, isolated utility functions (critical for tree-shaking)
├── services/      # Data fetching/business logic layer (API integration)
├── constants/     # Immutable global configurations
└── types/         # TypeScript contracts (ensuring compile-time optimization)
```

## Status

Currently utilizing `index.html` as the legacy entry point. All new development must occur within this structured directory to facilitate the optimization rollout.

## Optimization & Migration Path

The primary goal is the optimized component-based architecture transition:

1. **Select Bundler:** Implement a high-performance bundler (Vite/Rollup recommended) configured for ES module targeting.
2. **Refactor for Tree-Shaking:** Ensure `utils/` functions are exported individually (named exports) to enable aggressive unused code removal by the bundler.
3. **Componentization:** Migrate legacy logic into structured components (`src/components/`) and custom hooks (`src/hooks/`).
4. **Build Integration:** Update `index.html` to consume the production-optimized build output, ensuring code splitting is leveraged.