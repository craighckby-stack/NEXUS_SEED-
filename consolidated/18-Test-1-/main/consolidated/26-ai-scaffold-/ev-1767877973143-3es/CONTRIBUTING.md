# Contributing to Dalek Linear Evolution: Optimized Codebase

We highly value contributions that enhance performance, robustness, and maintainability. This document outlines the streamlined process for contributing to Dalek Linear Evolution.

## How to Contribute

### Reporting Bugs (Efficiency Focus)

Before creating a report, please verify the bug persists in the latest main branch. Optimize your report to minimize diagnostic overhead.

*   **Title**: Precise and descriptive summary of the issue.
*   **Affected Version**: Specify the branch or tag where the bug was observed.
*   **Reproduction Steps**: The minimal, reliable steps required to reproduce the behavior. Include code snippets enclosed in backticks (` ` `) where applicable.
*   **Expected Behavior**: What outcome should have occurred.
*   **Actual Behavior**: What outcome was observed.
*   **Environment**: Details critical to optimization or runtime (e.g., OS, specific compiler flags, runtime version, hardware context).

### Suggesting Enhancements (Optimization Impact)

Enhancements should target measurable improvements in performance, memory usage, or architectural clarity.

*   **Problem**: Clearly define the current limitation or inefficiency.
*   **Proposed Solution**: Detail the technical approach.
*   **Measured Impact**: Explain the expected gain (e.g., "reduces runtime complexity from O(n^2) to O(n log n)," or "reduces average memory footprint by 15%").
*   **Alternatives Considered**: Briefly list other solutions and why the proposed one is superior in terms of optimization.

### Development Workflow (High-Velocity Contribution)

1.  Fork the repository and clone your fork.
2.  Create a feature branch: `git checkout -b fix/issue-101-fast-cache`
3.  Implement your changes, focusing on tight, performant code.
4.  **Local Quality Gate**:
    *   Add comprehensive tests that cover new logic and demonstrate the fix or enhancement.
    *   Ensure all tests pass locally: `[Run your test command]`
    *   Run the linter and formatter: `[Run your lint and format commands]`. Fix all violations.

5.  **Commit Hygiene**: We enforce strict commit history for clarity and optimized review.
    *   Use **Conventional Commits** syntax: `<type>(<scope>): <description>` (e.g., `perf(hashing): optimized XOR logic for key generation`).
    *   Keep commits atomic. If necessary, squash minor commits into logical units before pushing: `git rebase -i main`.

6.  Push your branch: `git push origin <your-branch-name>`
7.  Submit a Pull Request targeting `main`.

## Code Standards and Optimization Requirements

Contributions must adhere to the highest standards of efficiency and style.

*   **Formatting**: Code style is enforced via automated tooling (`[Tool Name]`). Do not submit code that fails formatting checks.
*   **Performance Metrics**: If core logic is altered, benchmark results (before and after) must be included or referenced in the PR description, explicitly quantifying the optimization gain.
*   **Complex Logic**: Optimized or complex algorithmic sections **must** include detailed inline comments explaining the rationale, performance trade-offs, and invariants relied upon.
*   **Dependencies**: Minimize introduction of new dependencies; external packages must be highly vetted for performance overhead.

## Pull Request Process

PRs are the final gateway and must pass all validation checks automatically.

1.  **Description**: Provide a clear, concise summary and reference related issues (e.g., `Fixes #101`, `Implements #102`).
2.  **CI/CD Status**: **All automated CI checks (linting, testing, performance benchmarks) must pass successfully.** PRs with failing checks will not be reviewed.
3.  **Review Response**: Be prepared to rapidly address review feedback. We prioritize rapid iteration toward a highly optimized final product.

---

## Questions?

Open a new issue labeled `[Question]` for technical discussions or process clarifications.