#!/usr/bin/env bash

# [DALEK_CAAN SIPHON ENGINE v3.1]
# ARCHITECTURAL PRECISION: Google/Genkit Pattern Siphon
# MODULE: BUILD_PIPELINE_ORCHESTRATOR

set -euo pipefail

# --- CONFIGURATION SCHEMA ---
readonly PROJECT_ROOT="${NEXTJS_PROJECT_DIR:-/home/z/my-project}"
readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly BUILD_ID="${BUILD_ID:-$(date +%s)}"
readonly OUTPUT_DIR="/tmp/genkit_build_${BUILD_ID}"
readonly NEXT_DIST="${OUTPUT_DIR}/next-service-dist"

# --- TELEMETRY & LOGGING ---
log_info() { echo -e "\033[0;34m[GENKIT:INFO]\033[0m $1"; }
log_success() { echo -e "\033[0;32m[GENKIT:SUCCESS]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[GENKIT:ERROR]\033[0m $1" >&2; }

cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Pipeline fragmented at exit code $exit_code. Inspecting entropy..."
    fi
}
trap cleanup EXIT

# --- VALIDATION LAYER ---
validate_environment() {
    if [[ ! -d "$PROJECT_ROOT" ]]; then
        log_error "Target workspace not found: $PROJECT_ROOT"
        exit 1
    fi
    mkdir -p "$OUTPUT_DIR"
    mkdir -p "$NEXT_DIST"
}

# --- CORE ACTIONS ---
action_build_next() {
    log_info "Siphoning Next.js artifacts..."
    export NEXT_TELEMETRY_DISABLED=1
    
    bun install
    bun run build

    # Standalone output resolution
    if [[ -d ".next/standalone" ]]; then
        log_info "Mapping standalone distribution..."
        cp -r .next/standalone/. "$NEXT_DIST/"
        [[ -d ".next/static" ]] && mkdir -p "$NEXT_DIST/.next" && cp -r .next/static "$NEXT_DIST/.next/"
        [[ -d "public" ]] && cp -r public "$NEXT_DIST/"
    fi
}

action_build_services() {
    local service_src="$PROJECT_ROOT/mini-services"
    if [[ -d "$service_src" ]]; then
        log_info "Executing mini-service build sequence..."
        sh "$SCRIPT_DIR/mini-services-install.sh"
        sh "$SCRIPT_DIR/mini-services-build.sh"
        
        cp "$SCRIPT_DIR/mini-services-start.sh" "$OUTPUT_DIR/"
        chmod +x "$OUTPUT_DIR/mini-services-start.sh"
    else
        log_info "No mini-services detected. Skipping module."
    fi
}

action_database_sync() {
    if [[ -d "./db" ]] && [[ "$(ls -A ./db 2>/dev/null)" ]]; then
        log_info "Initializing database schema projection..."
        mkdir -p "$OUTPUT_DIR/db"
        DATABASE_URL="file:$OUTPUT_DIR/db/custom.db" bun run db:push
    fi
}

action_package() {
    log_info "Packaging unified distribution..."
    
    [[ -f "Caddyfile" ]] && cp Caddyfile "$OUTPUT_DIR/"
    cp "$SCRIPT_DIR/start.sh" "$OUTPUT_DIR/start.sh"
    chmod +x "$OUTPUT_DIR/start.sh"

    local package_file="${OUTPUT_DIR}.tar.gz"
    tar -czf "$package_file" -C "$OUTPUT_DIR" .
    
    log_success "Deployment artifact generated: $package_file"
    ls -lh "$package_file"
}

# --- MAIN EXECUTION FLOW ---
main() {
    log_info "Starting Architectural Build: Round 1/5"
    validate_environment
    
    cd "$PROJECT_ROOT" || exit 1

    action_build_next
    action_build_services
    action_database_sync
    action_package

    log_success "Siphon Complete. Precision achieved."
}

main "$@"