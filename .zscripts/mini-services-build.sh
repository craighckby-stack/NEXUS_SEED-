#!/usr/bin/env bash

set -eo pipefail

# --- CONFIGURATION: ARCHITECTURAL STATE ---
readonly GENKIT_VERSION="0.1.0-siphon"
readonly TRACE_ID="${BUILD_ID:-$(date +%s%N)}"
readonly PROJECT_ROOT="${MINI_SERVICES_ROOT:-$(pwd)}"
readonly BUNDLE_PATH="${MINI_SERVICES_DIST:-/tmp/genkit-build-$TRACE_ID}"
readonly ARTIFACT_ROOT="${PROJECT_ROOT}/dist"
readonly TELEMETRY_LOG="${BUNDLE_PATH}/telemetry.jsonl"

# --- GENKIT CORE: TELEMETRY ENGINE ---
log_telemetry() {
    local span_name=$1 status=$2 metadata=$3
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    mkdir -p "$(dirname "$TELEMETRY_LOG")"
    local entry
    entry=$(printf '{"timestamp":"%s","traceId":"%s","spanName":"%s","status":"%s","attr":%s}' \
        "$timestamp" "$TRACE_ID" "$span_name" "$status" "${metadata:-{}}")
    
    echo "$entry" >> "$TELEMETRY_LOG"
    [[ "$status" == "ERROR" ]] && echo "!! [TRACE_ERROR] $span_name: $metadata" >&2
}

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

# --- ACTION: ENTROPY PRUNING ---
action_prune_entropy() {
    find "$PROJECT_ROOT" -maxdepth 2 -name "node_modules" -type d -exec rm -rf {} +
    find "$PROJECT_ROOT" -name "*.log" -type f -delete
    mkdir -p "$BUNDLE_PATH"
}

# --- ACTION: RUNTIME VALIDATION ---
action_validate_runtime() {
    local missing=()
    command -v bun >/dev/null 2>&1 || missing+=("bun")
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_telemetry "runtime_validation" "ERROR" '{"missing_binaries":"'"${missing[*]}"'"}'
        return 1
    fi
}

# --- ACTION: SERVICE DISCOVERY & COMPILATION ---
action_compile_services() {
    local services_dir="${PROJECT_ROOT}/services"
    [[ ! -d "$services_dir" ]] && services_dir="$PROJECT_ROOT"

    for dir in "$services_dir"/*; do
        [[ -d "$dir" && -f "$dir/package.json" ]] || continue
        
        local name
        name=$(basename "$dir")
        local entry=""
        
        for e in "src/index.ts" "index.ts" "main.ts"; do
            [[ -f "$dir/$e" ]] && entry="$dir/$e" && break
        done

        if [[ -n "$entry" ]]; then
            log_telemetry "service_build" "PROCESSING" '{"service":"'"$name"'"}'
            bun build "$entry" \
                --outfile "$BUNDLE_PATH/services/$name.js" \
                --target bun \
                --minify-whitespace \
                --minify-syntax \
                --sourcemap=external > /dev/null
        fi
    done
}

# --- ACTION: DATA PROJECTION (PRISMA/SCHEMA) ---
action_project_schema() {
    if find "$PROJECT_ROOT" -name "schema.prisma" | grep -q .; then
        log_telemetry "schema_projection" "PROCESSING" '{"engine":"prisma"}'
        bun x prisma generate --schema="$(find "$PROJECT_ROOT" -name "schema.prisma" | head -n 1)"
    fi
}

# --- ACTION: ARTIFACT SEALING ---
action_seal_artifact() {
    mkdir -p "$ARTIFACT_ROOT"
    local output_file="${ARTIFACT_ROOT}/services-bundle-${TRACE_ID}.tar.gz"
    
    # Inject minimal entrypoint if missing
    if [[ ! -f "$BUNDLE_PATH/entrypoint.sh" ]]; then
        cat <<EOF > "$BUNDLE_PATH/entrypoint.sh"
#!/usr/bin/env bash
for svc in services/*.js; do
  bun run "\$svc" &
done
wait
EOF
    fi
    chmod +x "$BUNDLE_PATH/entrypoint.sh"
    
    tar -czf "$output_file" -C "$BUNDLE_PATH" .
    log_telemetry "artifact_sealed" "SUCCESS" '{"path":"'"$output_file"'"}'
}

# --- ORCHESTRATOR: GENKIT FLOW ---
define_genkit_flow() {
    log_telemetry "genkit_flow_init" "SUCCESS" '{"root":"'"$PROJECT_ROOT"'"}'

    local flow_manifest=(
        "workspace:prune|action_prune_entropy"
        "runtime:validate|action_validate_runtime"
        "services:compile|action_compile_services"
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

    echo "ARCHITECTURAL_PRECISION_ACHIEVED: $TRACE_ID"
}

define_genkit_flow "$@"