#!/usr/bin/env bash

set -eo pipefail

# --- ARCHITECTURAL STATE: GENKIT CORE v3.2 (FINAL EVOLUTION) ---
readonly GENKIT_VERSION="0.5.0-siphon-nexus"
readonly TRACE_ID="${BUILD_ID:-$(date +%s%N)}"
readonly PROJECT_ROOT="${MINI_SERVICES_ROOT:-$(pwd)}"
readonly BUNDLE_PATH="${MINI_SERVICES_DIST:-/tmp/genkit-siphon-$TRACE_ID}"
readonly ARTIFACT_ROOT="${PROJECT_ROOT}/dist"
readonly TELEMETRY_LOG="${BUNDLE_PATH}/telemetry.jsonl"
readonly SERVICE_MANIFEST="${BUNDLE_PATH}/manifest.json"

# --- GENKIT: TELEMETRY DISPATCHER ---
log_telemetry() {
    local span_name=$1 status=$2 metadata=$3
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    mkdir -p "$(dirname "$TELEMETRY_LOG")"
    local entry
    entry=$(printf '{"timestamp":"%s","traceId":"%s","spanName":"%s","status":"%s","attr":%s}' \
        "$timestamp" "$TRACE_ID" "$span_name" "$status" "${metadata:-{}}")
    
    echo "$entry" >> "$TELEMETRY_LOG"
    [[ "$status" == "FATAL" || "$status" == "ERROR" ]] && echo "!! [TRACE_ERR] $span_name: $metadata" >&2
}

# --- GENKIT: ACTION INVOKER ---
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

# --- ACTION: ENTROPY NEUTRALIZATION ---
action_prune_entropy() {
    log_telemetry "entropy_pruning" "PROCESSING" '{"scope":"workspace_cleanse"}'
    
    find "$PROJECT_ROOT" -maxdepth 2 -name ".next" -type d -exec rm -rf {} +
    find "$PROJECT_ROOT" -maxdepth 2 -name "node_modules" -type d -exec rm -rf {} +
    find "$PROJECT_ROOT" -name "*.log" -type f -delete
    
    mkdir -p "$BUNDLE_PATH/services"
    mkdir -p "$ARTIFACT_ROOT"
}

# --- ACTION: RUNTIME VALIDATION ---
action_validate_runtime() {
    local missing=()
    for bin in bun node; do
        command -v "$bin" >/dev/null 2>&1 || missing+=("$bin")
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_telemetry "runtime_validation" "ERROR" '{"missing_binaries":"'"${missing[*]}"'"}'
        return 1
    fi
}

# --- ACTION: FRONTEND COMPILATION ---
action_compile_frontend() {
    if [[ -f "$PROJECT_ROOT/next.config.js" || -f "$PROJECT_ROOT/next.config.mjs" ]]; then
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
            fi
        )
    fi
}

# --- ACTION: SERVICE COMPILATION ---
action_compile_services() {
    local services_found=()
    
    while IFS= read -r -d '' pkg_json; do
        local dir
        dir=$(dirname "$pkg_json")
        [[ "$dir" == "$PROJECT_ROOT" ]] && continue
        
        local svc_name
        svc_name=$(basename "$dir")
        
        local entry=""
        for e in "index.ts" "main.ts" "src/index.ts" "src/main.ts" "server.js"; do
            [[ -f "$dir/$e" ]] && entry="$dir/$e" && break
        done

        if [[ -n "$entry" ]]; then
            log_telemetry "compilation" "PROCESSING" '{"service":"'"$svc_name"'"}'
            (
                cd "$dir"
                bun build "$entry" \
                    --outfile "$BUNDLE_PATH/services/$svc_name.js" \
                    --target node \
                    --minify \
                    --sourcemap=external \
                    --define "process.env.GENKIT_TRACE_ID=\"$TRACE_ID\""
            )
            services_found+=("\"$svc_name\"")
        fi
    done < <(find "$PROJECT_ROOT" -maxdepth 3 -name "package.json" -not -path "*/node_modules/*" -print0)

    printf '{"traceId":"%s","services":[%s]}' "$TRACE_ID" "$(IFS=,; echo "${services_found[*]}")" > "$SERVICE_MANIFEST"
}

# --- ACTION: DATA PROJECTION ---
action_project_schema() {
    local schema_path
    schema_path=$(find "$PROJECT_ROOT" -name "schema.prisma" -not -path "*/node_modules/*" | head -n 1)
    
    if [[ -n "$schema_path" ]]; then
        log_telemetry "schema_projection" "PROCESSING" '{"path":"'"$schema_path"'"}'
        (
            cd "$(dirname "$schema_path")"
            bun x prisma generate
        )
        cp "$schema_path" "$BUNDLE_PATH/schema.prisma"
        [[ -d "$(dirname "$schema_path")/node_modules" ]] && cp -r "$(dirname "$schema_path")/node_modules" "$BUNDLE_PATH/"
    fi
}

# --- ACTION: ARTIFACT SEALING ---
action_seal_artifact() {
    local output_file="${ARTIFACT_ROOT}/genkit-release-${TRACE_ID}.tar.gz"
    
    # Process Manager Entrypoint with Signal Forwarding
    cat <<'EOF' > "$BUNDLE_PATH/entrypoint.sh"
#!/usr/bin/env bash
set -e
export GENKIT_RUNTIME_BOOT=$(date +%s)
pids=()

cleanup() {
    echo "[GENKIT] Shutting down services..."
    for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "[GENKIT] Initializing Nexus-grade micro-services..."
[[ -f "server.js" ]] && node server.js & pids+=($!)

for svc in services/*.js; do
    echo "[BOOT] Starting $svc"
    node "$svc" &
    pids+=($!)
done

wait "${pids[@]}"
EOF
    chmod +x "$BUNDLE_PATH/entrypoint.sh"
    
    tar -czf "$output_file" -C "$BUNDLE_PATH" .
    
    log_telemetry "artifact_sealed" "SUCCESS" '{"path":"'"$output_file"'"}'
    echo "FLOW_COMPLETED: $output_file"
}

# --- MAIN: GENKIT FLOW ORCHESTRATOR ---
define_genkit_flow() {
    log_telemetry "genkit_flow_init" "SUCCESS" '{"root":"'"$PROJECT_ROOT"'"}'

    local flow_manifest=(
        "workspace:prune|action_prune_entropy"
        "runtime:validate|action_validate_runtime"
        "frontend:compile|action_compile_frontend"
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

    log_telemetry "genkit_flow_terminal" "SUCCESS" '{"architectural_precision":"achieved"}'
}

define_genkit_flow "$@"