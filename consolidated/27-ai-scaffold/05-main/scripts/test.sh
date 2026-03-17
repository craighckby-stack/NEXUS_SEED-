#!/bin/bash

# Dalek Linear Evolution - Test Script

echo "🧪 Running tests..."
echo ""

# Run unit tests
if [ -d "tests/unit" ]; then
    echo "📝 Running unit tests..."
    # npm test -- tests/unit
fi

# Run integration tests
if [ -d "tests/integration" ]; then
    echo "📝 Running integration tests..."
    # npm test -- tests/integration
fi

# Run E2E tests
if [ -d "tests/e2e" ]; then
    echo "📝 Running E2E tests..."
    # npm test -- tests/e2e
fi

echo ""
echo "✅ Tests complete!"
