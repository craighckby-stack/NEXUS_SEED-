#!/usr/bin/env bash

# [DALEK_CAAN SIPHON ENGINE v3.1]
# ARCHITECTURAL PRECISION: Google/Genkit Pattern Siphon
# SOURCE DNA: Google/Genkit (Flow Orchestration, Schema Validation, Trace Observability)
# EVOLUTION: ROUND 5/5 - FINAL SATURATION ACHIEVED

set -euo pipefail

# --- VIRTUAL RUNTIME CONSTANTS ---
readonly GENKIT_VERSION="v0.6.0-siphon-final"
readonly TRACE_ID="genkit-trace-$(uuidgen 2>/dev/null || date +%s%N | sha256sum | head -c 24)"
readonly PROJECT_ROOT="${NEXTJS_PROJECT_DIR:-$(pwd)}"
readonly ARTIFACT_ROOT="${ARTIFACT_DIR:-/tmp/genkit/build/$(date +%Y%m%d)}"
readonly BUNDLE_PATH="${ARTIFACT_ROOT}/bundle"
readonly TELEMETRY_LOG="${ARTIFACT_ROOT}/telemetry.log"

# --- CORE OBSERVABILITY: GENKIT TRACE ENGINE ---
# Emulates Google/Genkit's OpenTelemetry span structure
log_telemetry() {
    local span_name=$1 status=$2 metadata=$3
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    local entry
    entry=$(printf '{"timestamp":"%s","traceId":"%s","spanName":"%s","status":"%s","attr":%s}' \
        "$timestamp" "$TRACE_ID" "$span_name" "$status" "${metadata:-{}}")
    
    echo "$entry" >> "$TELEMETRY_LOG"
    [[ "$status" == "ERROR" ]] && echo "!! [TRACE_ERROR] $span_name: $metadata" >&2
}

# --- ACTION RUNNER WITH ERROR REFLECTION ---
# Wraps execution in a Genkit-style action block
invoke_action() {
    local action_id=$1
    local action_fn=$2
    local start_ns
    start_ns=$(date +%s%N)

    log_telemetry "$action_id" "STARTED" '{"version":"'"$GENKIT_VERSION"'"}'

    if $action_fn; then
        local end_ns=$(date +%s%N)
        local duration_ms=$(( (end_ns - start_ns) / 1000000 ))
        log_telemetry "$action_id" "SUCCESS" '{"latency_ms":'"$duration_ms"'}'
    else
        local err_code=$?
        log_telemetry "$action_id" "ERROR" '{"exit_code":'"$err_code"'}'
        return "$err_code"
    fi
}

# --- SCHEMA: ENTROPY PRUNING (MOBY DNA INTEGRATION) ---
# Cleanses workspace based on the evolution context patterns
action_prune_entropy() {
    log_telemetry "entropy_pruning" "PROCESSING" '{"scope":"workspace"}'
    
    # Precise artifact removal to ensure a clean build slate
    find "$PROJECT_ROOT" -maxdepth 2 -name ".next" -type d -exec rm -rf {} +
    find "$PROJECT_ROOT" -maxdepth 2 -name "node_modules" -type d -exec rm -rf {} +
    find "$PROJECT_ROOT" -name "*.log" -type f -delete
    
    mkdir -p "$BUNDLE_PATH"
}

# --- SCHEMA: DEPENDENCY VALIDATION ---
action_validate_runtime() {
    local missing=()
    command -v bun >/dev/null 2>&1 || missing+=("bun")
    command -v node >/dev/null 2>&1 || missing+=("node")
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_telemetry "runtime_validation" "ERROR" '{"missing_binaries":"'"${missing[*]}"'"}'
        return 1
    fi
}

# --- ACTION: NEXTJS STANDALONE COMPILATION ---
action_compile_frontend() {
    (
        cd "$PROJECT_ROOT"
        export NEXT_TELEMETRY_DISABLED=1
        export NODE_ENV=production
        
        bun install --frozen-lockfile --quiet
        bun run build
        
        if [[ -d ".next/standalone" ]]; then
            cp -r .next/standalone/. "$BUNDLE_PATH/"
            [[ -d ".next/static" ]] && mkdir -p "$BUNDLE_PATH/.next" && cp -r .next/static "$BUNDLE_PATH/.next/"
            [[ -d "public" ]] && cp -r public "$BUNDLE_PATH/"
        else
            return 1
        fi
    )
}

# --- ACTION: MICRO-SERVICE SYNTHESIS ---
action_synthesize_services() {
    local scripts_dir="$PROJECT_ROOT/.zscripts"
    [[ ! -d "$scripts_dir" ]] && return 0

    # Execute deterministic service hooks
    for hook in "mini-services-install.sh" "mini-services-build.sh"; do
        if [[ -f "$scripts_dir/$hook" ]]; then
            log_telemetry "service_hook" "EXECUTING" '{"hook":"'"$hook"'"}'
            bash "$scripts_dir/$hook"
        fi
    done

    # Inject runtime entrypoints
    [[ -f "$scripts_dir/start.sh" ]] && cp "$scripts_dir/start.sh" "$BUNDLE_PATH/entrypoint.sh"
}

# --- ACTION: DATA LAYER PROJECTION ---
action_project_schema() {
    if grep -q "prisma" "$PROJECT_ROOT/package.json" 2>/dev/null; then
        (
            cd "$PROJECT_ROOT"
            DATABASE_URL="file:${BUNDLE_PATH}/genkit_runtime.db" 
            bun x prisma generate
            bun x prisma db push --accept-data-loss
        )
    fi
}

# --- ACTION: ARTIFACT SEALING ---
action_seal_artifact() {
    local output_file="${ARTIFACT_ROOT}/genkit-release-${TRACE_ID}.tar.gz"
    
    # Ensure entrypoint exists
    [[ ! -f "$BUNDLE_PATH/entrypoint.sh" ]] && echo -e "#!/usr/bin/env bash\nnode server.js" > "$BUNDLE_PATH/entrypoint.sh"
    chmod +x "$BUNDLE_PATH/entrypoint.sh"
    
    tar -czf "$output_file" -C "$BUNDLE_PATH" .
    
    log_telemetry "artifact_sealed" "SUCCESS" '{"path":"'"$output_file"'"}'
    echo "FLOW_COMPLETED: $output_file"
}

# --- MAIN FLOW ORCHESTRATOR ---
# Declarative pipeline mapping action IDs to functional logic
define_genkit_flow() {
    mkdir -p "$ARTIFACT_ROOT"
    log_telemetry "genkit_flow_init" "SUCCESS" '{"root":"'"$PROJECT_ROOT"'"}'

    local flow_manifest=(
        "workspace:prune|action_prune_entropy"
        "runtime:validate|action_validate_runtime"
        "frontend:compile|action_compile_frontend"
        "services:synthesize|action_synthesize_services"
        "schema:project|action_project_schema"
        "artifact:seal|action_seal_artifact"
    )

    for step in "${flow_manifest[@]}"; do
        IFS="|" read -r action_id action_fn <<< "$step"
        invoke_action "$action_id" "$action_fn" || {
            log_telemetry "flow_aborted" "FATAL" '{"failed_at":"'"$action_id"'"}'
            exit 1
        }
    done

    log_telemetry "genkit_flow_terminal" "SUCCESS" '{"architectural_precision":"achieved"}'
}

# EXECUTE WITH SHELL CONTEXT
define_genkit_flow "$@"