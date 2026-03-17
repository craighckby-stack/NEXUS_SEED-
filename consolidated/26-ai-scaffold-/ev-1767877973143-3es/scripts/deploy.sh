#!/bin/bash

# Dalek Linear Evolution - Optimized Deploy Script (Focus: Robustness and Efficiency)

# Optimization 1: Strict error handling. Exit on non-zero status, unset variables, and pipeline failures.
set -euo pipefail

TARGET_BRANCH="gh-pages"
SOURCE_BRANCH="main"

echo "🤖 Starting optimized deployment sequence..."

# --- 1. Determine Current Branch and Switch ---
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
    echo "ðŸ“Œ Checking out/creating $TARGET_BRANCH..."
    # Attempt checkout; if it fails (branch DNE), create it.
    git checkout "$TARGET_BRANCH" || git checkout -b "$TARGET_BRANCH"
fi

# --- 2. Merge Latest Changes ---
echo "ðŸ”„ Merging $SOURCE_BRANCH into $TARGET_BRANCH..."

# Optimization 2: Ensure merge is atomic, non-interactive, and provides a clear default message.
# The `set -e` handles failure here automatically.
git merge "$SOURCE_BRANCH" --no-edit -m "Deploy: Automated merge from $SOURCE_BRANCH"

# --- 3. Push to GitHub ---
echo "ðŸ“¤ Pushing $TARGET_BRANCH to origin..."
git push origin "$TARGET_BRANCH"

# --- 4. Cleanup: Switch back to original branch if necessary ---
if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
    echo "ðŸŽ¯ Switching back to $CURRENT_BRANCH..."
    # Suppress output during switch back
    git checkout "$CURRENT_BRANCH" > /dev/null 2>&1
fi

echo ""
echo "âœ… Deployment complete!"
echo "ðŸŒ  Live at: https://craighckby-stack.github.io/ai-scaffold/"