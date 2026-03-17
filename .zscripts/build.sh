**FINAL DOCUMENT AUDITED AND STRIPPED VERSION**

#!/bin/bash

# Set default logging level
LOG_LEVEL="${LOG_LEVEL:-warn}"

# Define a custom logging function to handle logging levels
log() {
  local LEVEL=$1
  local MESSAGE=$2
  if [[ $LEVEL =~ ^(debug|info|warn|error)$ ]]; then
    [ "$LEVEL" = "debug" ] && echo "[Debug] $MESSAGE" || echo "[ $LEVEL ] $MESSAGE"
  else
    echo "[UNKNOWN] $MESSAGE"
  fi
}

# Function to generate a changelog
generate_changelog() {
  local CHANGES=$(git --no-pager diff --stat)
  local MESSAGE="Added changes:"
  while IFS= read -r LINE; do
    MESSAGE+="\n - $LINE"
  done <<< "$CHANGES"
  echo "$MESSAGE"
}

# Function to run flake8
flake8() {
  local FILENAME=$1
  pyflakes $FILENAME
}

# Check if the current branch has changes
has_changes() {
  local BRANCH=$1
  if git -C "$BRANCH" diff --quiet; then
    return 1
  else
    return 0
  fi
}

# Define the main function
main() {
  log "info" "Starting build process..."

  # Run generate_changelog and output to changelog.txt
  generate_changelog > changelog.txt || log "error" "Failed to generate changelog"

  # Run flake8 on code files
  find . -name "*.py" -type f -exec flake8 {} \;

  # Check if the current branch has changes
  if has_changes "$(git rev-parse --abbrev-ref HEAD)"; then
    log "error" "Changes detected, please commit or stash before building"
    exit 1
  fi
}

# Call the main function
main