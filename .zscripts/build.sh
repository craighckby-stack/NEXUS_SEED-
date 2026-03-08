#!/usr/bin/env bash

# [DALEK_CAAN SIPHON ENGINE v3.1]
# ARCHITECTURAL PRECISION: Google/Genkit Pattern Siphon
# MODULE: GENKIT_FLOW_ORCHESTRATOR
# EVOLUTION: ROUND 2/5

set -euo pipefail

# --- GENKIT SCHEMA DEFINITIONS ---
readonly PROJECT_ROOT="${NEXTJS_PROJECT_DIR:-/home/z/my-project}"
readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly TRACE_ID="build_$(date +%s)_$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 8 | head -n 1)"
readonly OUTPUT_DIR="/tmp/genkit_artifacts/${TRACE_ID}"
readonly ASSET_MANIFEST="${OUTPUT_DIR}/manifest.json"

# --- TELEMETRY SUBSYSTEM ---
log_event() {
    local level=$1
    local message=$2
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    printf '{"timestamp":"%s","level":"%s","traceId":"%s","message":"%s"}\n' \
        "$timestamp" "$level" "$TRACE_ID" "$message"
}

step_start() { log_event "INFO" "STEP_START: $1"; }
step_done() { log_event "INFO" "STEP_COMPLETE: $1"; }
step_fail() { log_event "ERROR" "STEP_FAILED: $1 - $2"; exit 1; }

# --- FLOW ACTIONS ---
action_initialize_context() {
    step_start "context_init"
    [[ ! -d "$PROJECT_ROOT" ]] && step_fail "context_init" "Missing PROJECT_ROOT"
    mkdir -p "$OUTPUT_DIR/dist"
    echo "{\"traceId\":\"$TRACE_ID\",\"createdAt\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" > "$ASSET_MANIFEST"
    step_done "context_init"
}

action_compile_frontend() {
    step_start "frontend_compilation"
    cd "$PROJECT_ROOT"
    export NEXT_TELEMETRY_DISABLED=1
    
    bun install --frozen-lockfile
    bun run build

    if [[ -d ".next/standalone" ]]; then
        local target="$OUTPUT_DIR/dist/server"
        mkdir -p "$target"
        cp -r .next/standalone/. "$target/"
        [[ -d ".next/static" ]] && mkdir -p "$target/.next" && cp -r .next/static "$target/.next/"
        [[ -d "public" ]] && cp -r public "$target/"
    fi
    step_done "frontend_compilation"
}

action_siphon_services() {
    step_start "service_siphon"
    local service_path="$PROJECT_ROOT/mini-services"
    if [[ -d "$service_path" ]]; then
        /usr/bin/env bash "$SCRIPT_DIR/mini-services-install.sh"
        /usr/bin/env bash "$SCRIPT_DIR/mini-services-build.sh"
        cp "$SCRIPT_DIR/mini-services-start.sh" "$OUTPUT_DIR/dist/"
    fi
    step_done "service_siphon"
}

action_schema_projection() {
    step_start "database_projection"
    if [[ -d "./db" ]]; then
        DATABASE_URL="file:$OUTPUT_DIR/dist/genkit.db" bun run db:push
    fi
    step_done "database_projection"
}

action_finalize_bundle() {
    step_start "bundle_finalization"
    cp "$SCRIPT_DIR/start.sh" "$OUTPUT_DIR/dist/run.sh"
    chmod +x "$OUTPUT_DIR/dist/run.sh"
    
    tar -czf "${OUTPUT_DIR}/deployment.tar.gz" -C "$OUTPUT_DIR/dist" .
    log_event "SUCCESS" "Artifact generated at ${OUTPUT_DIR}/deployment.tar.gz"
    step_done "bundle_finalization"
}

# --- MAIN FLOW EXECUTION ---
main_flow() {
    log_event "INFO" "Starting Genkit-Inspired Build Flow Round 2"
    
    action_initialize_context
    action_compile_frontend
    action_siphon_services
    action_schema_projection
    action_finalize_bundle
    
    log_event "INFO" "Flow complete. Precision state: SATURATED"
}

main_flow "$@"