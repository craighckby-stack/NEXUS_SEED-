#!/bin/bash

# Dalek Linear Evolution - Setup Script

# Optimization focus: Robustness (set -e/u/o), structured checks, centralized package manager logic.
# Exit immediately if a command exits with a non-zero status.
set -euo pipefail

echo "ðŸš€ Setting up Dalek Linear Evolution..."
echo ""

# --- 1. Check prerequisites ---
echo "ðŸ“‹ Checking prerequisites..."

check_tool() {
    local tool_name=$1
    local friendly_name=$2
    if ! command -v "$tool_name" &> /dev/null; then
        echo "â Œ $friendly_name is not installed. Setup aborted."
        exit 1
    fi
}

# Checks are isolated and exit immediately upon failure
check_tool git "Git"
check_tool node "Node.js"

echo "âœ… All prerequisites met"
echo ""

# --- 2. Create environment file ---
if [ ! -f .env ]; then
    echo "ðŸ“  Creating .env file from template..."
    # If cp fails (e.g., .env.example missing), set -e will halt execution
    cp .env.example .env
    echo "âœ… .env file created"
    echo "âš â ï¸   Please edit .env and add your API keys"
    echo ""
fi

# --- 3. Install dependencies ---
if [ -f package.json ]; then
    echo "ðŸ“¦ Installing dependencies..."
    
    INSTALL_COMMAND=""

    # Prioritized check for package managers
    if command -v npm &> /dev/null; then
        INSTALL_COMMAND="npm install"
    elif command -v yarn &> /dev/null; then
        INSTALL_COMMAND="yarn install"
    elif command -v pnpm &> /dev/null; then
        INSTALL_COMMAND="pnpm install"
    fi

    if [ -n "$INSTALL_COMMAND" ]; then
        echo "Running: $INSTALL_COMMAND"
        # Execute installation. If the installation fails, set -e causes the script to exit with failure.
        $INSTALL_COMMAND
        echo "âœ… Dependencies installed successfully."
    else
        echo "âš â ï¸   No supported package manager found (npm, yarn, pnpm). Skipping installation."
    fi
    echo ""
fi

# --- 4. Completion ---
echo "âœ… Setup complete!"
echo "ðŸ“  Next steps:"
echo "   1. Edit .env and add your API keys"
echo "   2. Run: npm start (or open index.html in browser)"
echo ""