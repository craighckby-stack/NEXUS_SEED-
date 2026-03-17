# Test Suite Documentation

## Overview
This directory (`tests/`) houses the complete suite of automated tests for the application. Our primary goal is to provide rapid, reliable feedback on code changes while maintaining minimal CI pipeline execution time.

## 🚀 Optimization Focus: Running Tests

To achieve optimal developer workflow and CI performance, tests are categorized and prioritized.

### 1. Fast Iteration (Local Development Default)
Run all unit tests and fast integration tests, skipping expensive E2E and marked 'slow' tests. This provides the quickest confidence check.

```bash
# Recommended standard command for developers
pytest -m "not e2e and not slow"
```

### 2. Full Suite (CI/Release Candidate)
Run all tests, including resource-intensive end-to-end checks.

```bash
# Execute only in validated environments (CI)
pytest
```

### 3. Target Specific Modules
To minimize run time when working on a specific feature, target the corresponding test file directly:

```bash
pytest tests/unit/services/user_auth_test.py
```

---

## ⏱️ Performance Tuning

Optimization of the test suite itself is critical. Use the following techniques to ensure the test suite doesn't become a bottleneck:

### Identify Slow Tests
Use the `--durations` flag to list the slowest tests. Any test consistently appearing in the top 10 should be analyzed for setup complexity or unnecessary I/O.

```bash
# List the 10 slowest running tests
pytest --durations=10
```

### Parallel Execution (CI Optimization)
The CI/CD pipeline utilizes `pytest-xdist` to distribute tests across multiple workers, significantly reducing execution time. *Ensure tests are isolated and do not rely on global state to prevent failures during parallel runs.*

## Test Structure

Tests are organized by velocity and scope:

| Directory | Scope | Optimization Tag | Notes |
| :--- | :--- | :--- | :--- |
| `unit/` | Single Function/Class | (None/Default) | Must be highly performant (< 100ms each). No I/O allowed. |
| `integration/` | Component Interaction | `@pytest.mark.integration` | Tests interfaces between major services (using mocks for external systems). |
| `e2e/` | Full System Validation | `@pytest.mark.e2e` | Requires a live environment setup. Should be run sparingly. |
| `fixtures/` | Shared Utilities | N/A | Contains reusable mock data, temporary database setups, and factory utilities. |

## Contribution Guidelines

1.  **Marking:** Every new test file must utilize the appropriate markers (`@pytest.mark.integration`, `@pytest.mark.slow`, `@pytest.mark.e2e`) to fit into the optimized execution structure.
2.  **Isolation:** Tests must be independent. Avoid shared state between tests to ensure compatibility with parallel execution (`pytest-xdist`).
3.  **Setup/Teardown:** Utilize fixture scopes (`session`, `module`, `function`) judiciously. Use `session` scope for heavy resource initialization (e.g., database connection) to optimize overall test startup time.