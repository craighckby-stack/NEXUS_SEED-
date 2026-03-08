#!/usr/bin/env bash

# [DALEK_CAAN SIPHON ENGINE v3.1]
# ARCHITECTURAL PRECISION: Google/Genkit Pattern Siphon
# SOURCE DNA: Google/Genkit (Flow Orchestration & Schema Validation)
# EVOLUTION: ROUND 4/5 - SYSTEM SATURATION

set -euo pipefail

# --- GENKIT FLOW CONFIGURATION SCHEMA ---
readonly GENKIT_VERSION="v0.5.2-siphon"
readonly TRACE_ID="trace-$(uuidgen 2>/dev/null || date +%s%N | sha256sum | head -c 16)"
readonly PROJECT_DIR="${NEXTJS_PROJECT_DIR:-$(pwd)}"
readonly BUILD_ARTIFACTS="${ARTIFACT_DIR:-/tmp/genkit/build/${TRACE_ID}}"
readonly OUTPUT_BUNDLE="${BUILD_ARTIFACTS}/bundle"

# --- CORE TELEMETRY ENGINE (OPEN-TELEMETRY COMPLIANT) ---
# Schema: { time, traceId, spanId, name, state, metadata }
log_span() {
    local name=$1 state=$2 meta=$3
    printf '{"time":"%s","traceId":"%s","span":"%s","status":"%s","data":%s}\n' \
        "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$TRACE_ID" "$name" "$state" "${meta:-{}}"
}

# --- GENKIT ACTION RUNNER ---
# Implements functional isolation and error reflection
run_action() {
    local action_id=$1
    local action_cmd=$2
    local start_time
    start_time=$(date +%s)

    log_span "$action_id" "STARTED" '{"engine":"'"$GENKIT_VERSION"'"}'

    if eval "$action_cmd"; then
        local duration=$(($(date +%s) - start_time))
        log_span "$action_id" "SUCCESS" '{"duration_sec":'"$duration"'}'
    else
        local exit_code=$?
        log_span "$action_id" "FAILED" '{"exit_code":'"$exit_code"'}'
        return "$exit_code"
    fi
}

# --- PLUGIN: ENVIRONMENT VALIDATOR ---
action_env_setup() {
    mkdir -p "$OUTPUT_BUNDLE"
    command -v bun >/dev/null 2>&1 || { echo "ERROR: Runtime 'bun' required"; return 1; }
    
    # State Reflection
    cat > "${BUILD_ARTIFACTS}/state.json" <<EOF
{
  "version": "$GENKIT_VERSION",
  "traceId": "$TRACE_ID",
  "timestamp": "$(date -u +%s)",
  "features": ["nextjs", "mini-services", "prisma"]
}
EOF
}

# --- PLUGIN: NEXTJS STANDALONE COMPILER ---
action_build_frontend() {
    (
        cd "$PROJECT_DIR"
        export NEXT_TELEMETRY_DISABLED=1
        bun install --frozen-lockfile
        bun run build
        
        if [[ -d ".next/standalone" ]]; then
            cp -r .next/standalone/. "$OUTPUT_BUNDLE/"
            [[ -d ".next/static" ]] && mkdir -p "$OUTPUT_BUNDLE/.next" && cp -r .next/static "$OUTPUT_BUNDLE/.next/"
            [[ -d "public" ]] && cp -r public "$OUTPUT_BUNDLE/"
        else
            return 1
        fi
    )
}

# --- PLUGIN: MICRO-SERVICE INJECTOR ---
action_inject_services() {
    local script_dir="$PROJECT_DIR/.zscripts"
    [[ ! -d "$script_dir" ]] && return 0

    # Execute service build hooks if present
    for hook in "mini-services-install.sh" "mini-services-build.sh"; do
        [[ -f "$script_dir/$hook" ]] && bash "$script_dir/$hook"
    done

    # Map runtime artifacts
    [[ -f "$script_dir/mini-services-start.sh" ]] && cp "$script_dir/mini-services-start.sh" "$OUTPUT_BUNDLE/"
}

# --- PLUGIN: SCHEMA PROJECTION (DATA LAYER) ---
action_project_schema() {
    if grep -q "\"db:push\"" "$PROJECT_DIR/package.json" 2>/dev/null; then
        (cd "$PROJECT_DIR" && DATABASE_URL="file:${OUTPUT_BUNDLE}/genkit.db" bun run db:push)
    fi
}

# --- PLUGIN: ARTIFACT PACKAGING ---
action_seal_bundle() {
    local entrypoint="$OUTPUT_BUNDLE/entrypoint.sh"
    
    if [[ -f "$PROJECT_DIR/.zscripts/start.sh" ]]; then
        cp "$PROJECT_DIR/.zscripts/start.sh" "$entrypoint"
    else
        echo -e "#!/usr/bin/env bash\nnode server.js" > "$entrypoint"
    fi
    
    chmod +x "$entrypoint"
    tar -czf "${BUILD_ARTIFACTS}/release.tar.gz" -C "$OUTPUT_BUNDLE" .
    
    # Export flow output
    echo "GENKIT_FLOW_OUTPUT=${BUILD_ARTIFACTS}/release.tar.gz"
}

# --- MAIN FLOW ORCHESTRATOR ---
define_genkit_flow() {
    log_span "GENKIT_FLOW" "INIT" '{"project":"'"$PROJECT_DIR"'"}'

    local actions=(
        "env:setup|action_env_setup"
        "build:frontend|action_build_frontend"
        "inject:services|action_inject_services"
        "project:schema|action_project_schema"
        "seal:bundle|action_seal_bundle"
    )

    for step in "${actions[@]}"; do
        IFS="|" read -r id fn <<< "$step"
        run_action "$id" "$fn" || {
            log_span "GENKIT_FLOW" "ABORTED" '{"failed_step":"'"$id"'"}'
            exit 1
        }
    done

    log_span "GENKIT_FLOW" "COMPLETED" '{"status":"ARCHITECTURAL_PRECISION_ACHIEVED"}'
}

# TRIGGER EXECUTION
define_genkit_flow "$@"