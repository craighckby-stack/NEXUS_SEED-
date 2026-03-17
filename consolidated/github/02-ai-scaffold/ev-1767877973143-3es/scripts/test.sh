#!/bin/bash

# Dalek Linear Evolution - Test Script
# Optimization Focus: Fail Fast, Robust Execution (set -e), DRY code via functions.

set -euo pipefail # Strict mode: exit immediately on non-zero status

echo "ðŸ§ª Running tests..."
echo ""

EXIT_STATUS=0

# Helper function to run a specific test suite
run_suite() {
    local suite_name=$1
    local dir=$2
    local args=$3

    if [ -d "$dir" ]; then
        echo "ðŸ“  Running $suite_name tests ($dir)..."
        
        # Optimization: Execute the test command and capture exit code immediately.
        if ! npm test -- $args; then
            echo "ðŸ”¥ ERROR: $suite_name tests failed."
            EXIT_STATUS=1
            return 1 # Signal failure to caller
        fi
        echo "âœ… $suite_name tests passed."
    fi
    return 0
}

# --- Test Execution Order (Unit -> Integration -> E2E) ---

# 1. Run unit tests
if ! run_suite "unit" "tests/unit" "-- tests/unit"; then
    # Optimization: Unit tests are foundational. If they fail, stop execution.
    echo "Aborting further tests due to critical unit test failure."
    exit $EXIT_STATUS
fi

# 2. Run integration tests
# Allow execution to proceed even if integration fails, but record the error.
run_suite "integration" "tests/integration" "-- tests/integration" || true 

# 3. Run E2E tests
# Allow execution to proceed even if E2E fails, but record the error.
run_suite "E2E" "tests/e2e" "-- tests/e2e" || true

# --- Final Report ---

echo ""
if [ "$EXIT_STATUS" -eq 0 ]; then
    echo "âœ… All test suites complete and passed!"
else
    echo "âš  Tests finished with failures recorded."
fi

# Exit with the overall status
exit $EXIT_STATUS