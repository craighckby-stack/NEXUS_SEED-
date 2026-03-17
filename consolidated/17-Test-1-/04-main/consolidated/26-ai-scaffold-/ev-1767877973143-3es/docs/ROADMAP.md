# Roadmap

## Current Version: v19.0.0

## Planned Features: Focusing on Core Optimization and Scalability

### Phase 1: Efficiency & Resilience (v19.1.0)
* [ ] Implement optimized internal caching layer for dependency analysis and LLM response reuse (Significant performance gain).
* [ ] Refactor core evolution engine for strict idempotency and atomic file writes, minimizing failure overhead.
* [ ] Introduce multi-repository support in a single, unified evolution session (Workflow efficiency optimization).
* [ ] Comprehensive rollback mechanism and detailed failure recovery pathways.
* [ ] Add a high-fidelity visual diff viewer for transparent and faster change review.

### Phase 2: Performance & Scale (v20.0.0)
* [ ] Integrate dedicated performance profiling hooks (e.g., PProf) into the core engine to identify bottlenecks.
* [ ] Enable parallel processing of non-dependent file changes during the evolution phase (Horizontal scaling optimization).
* [ ] Support for multiple AI providers (OpenAI, Anthropic, Gemini) allowing dynamic routing based on cost/latency metrics.
* [ ] Advanced code metrics and visualization dashboard focusing on quantifiable optimization scores.
* [ ] Introduction of Custom Goal-Oriented Strategies (allowing users to define and measure performance targets).

### Phase 3: Automation & Ecosystem Integration (v21.0.0+)
* [ ] Continuous evolution integration with GitHub Actions/GitLab CI.
* [ ] Automated pull request generation based on successful, optimized evolution runs.
* [ ] Support for self-hosted and fine-tuned AI models (Maximizing domain-specific optimization).
* [ ] Integration with leading static analysis tools (e.g., SonarQube) for automated optimization scoring.
* [ ] Code Review AI Assistant focused on maximizing structural efficiency and runtime performance.

## Ideas Under Consideration (Focusing on advanced optimization tooling)

- Real-time performance impact visualization during evolution cycles.
- Dynamic workload distribution and resource management for extremely large codebases.
- Predictive optimization modeling (suggesting ideal, most efficient evolution pathways).
- Evolution templates and presets focusing on specific optimization tasks (e.g., latency reduction).
- Detailed historical trend analysis focusing on optimization metrics.

## Contribution

Want to help? Check out [CONTRIBUTING.md](../CONTRIBUTING.md)

## Changelog

See [CHANGELOG.md](../CHANGELOG.md) for version history.