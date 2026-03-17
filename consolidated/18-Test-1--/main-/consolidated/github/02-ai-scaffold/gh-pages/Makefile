.PHONY: help start dev test lint validate clean deploy

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?##/ {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

start: ## Start development server
	@echo "Starting development server..."
	@python -m http.server 8000

dev: start ## Alias for start

test: ## Run tests
	@echo "Running tests..."
	@bash scripts/test.sh

lint: ## Run linter
	@echo "Running linter..."
	@echo "No linter configured"

validate: ## Validate code
	@echo "Validating code..."
	@node tools/validate.js

clean: ## Remove build artifacts
	@echo "Cleaning..."
	@rm -rf node_modules/
	@rm -rf dist/
	@rm -rf .cache/
	@rm -rf coverage/

deploy: ## Deploy to GitHub Pages
	@echo "Deploying to GitHub Pages..."
	@bash scripts/deploy.sh

install: ## Install dependencies
	@echo "Installing dependencies..."
	@npm install || yarn install || pnpm install

setup: ## Setup project
	@echo "Setting up project..."
	@bash scripts/setup.sh
