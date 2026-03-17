# Development Tools

This directory contains utility scripts and tools designed to streamline development, testing, deployment, and maintenance tasks for this project.

## Table of Contents

1. [Goals and Scope](#goals-and-scope)
2. [Prerequisites](#prerequisites)
3. [General Usage](#general-usage)
4. [Core Tooling](#core-tooling)
    * [Setup and Environment](#setup-and-environment)
    * [Code Quality (Linting & Formatting)](#code-quality-linting--formatting)
    * [Build & Release](#build--release)
5. [Contributing & Optimization](#contributing--optimization)

## Goals and Scope

The primary goal of this toolset is to reduce manual intervention and standardize repetitive tasks, leading to faster development cycles and reduced error rates.

## Prerequisites

Ensure you have the following installed and configured:
*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   Specific environment variables configured (refer to `.env.example`).

## General Usage

Most standardized tasks are abstracted into scripts within the root `package.json` for easy access.

```bash
# Execute a standardized tool command
npm run tool:<command-name> 
# Example: Running the cleanup utility
npm run tool:cleanup 
```

For low-level shell scripts (e.g., configuration setup) located directly in this directory:

```bash
./tools/script_name.sh [arguments]
```

## Core Tooling

### Setup and Environment

**`tool:env-check`**
*   **Purpose:** Verifies that all necessary environment variables are present and correctly formatted.
*   **Optimization:** Fails fast if the environment is misconfigured, preventing wasted build time.

**`./tools/install_deps.sh`**
*   **Purpose:** Handles package installation for specific tooling environments (e.g., peer dependencies or legacy compatibility).

### Code Quality (Linting & Formatting)

**`tool:format:check`**
*   **Purpose:** Checks for formatting errors without modifying files. (Ideal for CI/CD quick checks).

**`tool:format:fix`**
*   **Purpose:** Automatically applies formatting rules (Prettier/ESLint fix) to the entire codebase.

**`tool:lint`**
*   **Purpose:** Executes deep code analysis to catch potential bugs and enforce style guides.

### Build & Release

**`tool:build:analyze`**
*   **Purpose:** Generates a detailed report (e.g., Webpack Bundle Analyzer) showing the composition and size of the output artifacts.
*   **Optimization:** Essential for identifying large dependencies and optimizing bundle size.

**`tool:release:tag`**
*   **Purpose:** Automates semantic version bumping, git tagging, and changelog generation.

## Contributing & Optimization

When adding new scripts or modifying existing tools:

1.  **Efficiency:** Ensure scripts execute quickly. Avoid redundant file operations or unnecessary process spawning.
2.  **Idempotency:** Tools should be designed so running them multiple times yields the same result without corruption.
3.  **Documentation:** Update this `README.md` and provide clear usage instructions or help flags (`--help`) within the tool itself.
4.  **Execution Path:** If the tool is intended for frequent use, define it in `package.json` for standardized execution (`npm run tool:name`).