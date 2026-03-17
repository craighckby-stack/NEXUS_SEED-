```makefile
# --- Configuration ---

# Use .ONESHELL to slightly optimize shell invocations for multi-line recipes,
# though we prioritize standard Make for portability unless complex logic is needed.
# .ONESHELL:

.PHONY: help start dev test lint validate clean deploy install setup

# Define common commands and paths using variables for easy maintenance and replacement
PYTHON := python
NODE := node
RM := rm -rf
SHELL := /bin/bash
CLEAN_DIRS := node_modules/ dist/ .cache/ coverage/

# --- Standard Targets ---

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?##/ {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

start: ## Start development server
	@echo "Starting development server on http://localhost:8000"
	@$(PYTHON) -m http.server 8000

dev: start ## Alias for start

test: ## Run tests
	@echo "Running tests..."
	@$(SHELL) scripts/test.sh

lint: ## Run linter
	@echo "No linter configured. Skipping validation."
	@: # No-op command to ensure success while being silent

validate: ## Validate code structure
	@echo "Validating code..."
	@$(NODE) tools/validate.js

clean: ## Remove build artifacts (Optimized: combined RM operations)
	@echo "Cleaning artifacts: $(CLEAN_DIRS)"
	@$(RM) $(CLEAN_DIRS)

deploy: ## Deploy to GitHub Pages
	@echo "Deploying to GitHub Pages..."
	@$(SHELL) scripts/deploy.sh

install: ## Install dependencies (npm/yarn/pnpm fallback)
	@echo "Installing dependencies..."
	@npm install || yarn install || pnpm install

setup: install ## Setup project (install dependencies, then run setup script)
	@echo "Running project setup script..."
	@$(SHELL) scripts/setup.sh
```