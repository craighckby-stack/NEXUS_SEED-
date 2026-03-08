#!/usr/bin/env bash
set -euo pipefail

# --- GENKIT_CAAN ARCHITECTURAL CONFIGURATION ---
export GENKIT_ENV="${GENKIT_ENV:-production}"
export GENKIT_TRACE_LEVEL="${GENKIT_TRACE_LEVEL:-DEBUG}"
PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
ARTIFACT_ROOT="${ARTIFACT_ROOT:-$PROJECT_ROOT/dist}"
BUNDLE_PATH="${BUNDLE_PATH:-$PROJECT_ROOT/.genkit_bundle}"
SERVICE_MANIFEST="$BUNDLE_PATH/manifest.json"
TRACE_ID=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 24 ; echo '')

# --- TELEMETRY ENGINE (GENKIT DNA) ---
log_telemetry() {
    local stage=$1 status=$2 metadata=$3
    printf '{"timestamp":"%s","traceId":"%s","stage":"%s","status":"%s","payload":%s}\n' \
        "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$TRACE_ID" "$stage" "$status" "$metadata" >&2
}

invoke_action() {
    local action_id=$1 fn_name=$2
    local start_ms; start_ms=$(date +%s%3N)
    log_telemetry "$action_id" "INVOKING" '{"fn":"'"$fn_name"'"}'
    
    if $fn_name; then
        local end_ms; end_ms=$(date +%s%3N)
        log_telemetry "$action_id" "SUCCESS" '{"latency_ms":'"$((end_ms - start_ms))"'}'
    else
        log_telemetry "$action_id" "ERROR" '{"error":"action_execution_failed"}'
        return 1
    fi
}

# --- ACTION: PRUNE_ENTROPY ---
action_prune_workspace() {
    find "$PROJECT_ROOT" -maxdepth 2 -type d \( -name ".next" -o -name "node_modules" -o -name ".turbo" -o -name ".genkit_bundle" \) -exec rm -rf {} +
    find "$PROJECT_ROOT" -name "*.log" -type f -delete
    mkdir -p "$BUNDLE_PATH/services" "$ARTIFACT_ROOT"
}

# --- ACTION: RUNTIME_ASSERTION ---
action_validate_runtime() {
    local requirements=("bun" "node" "tar")
    for req in "${requirements[@]}"; do
        if ! command -v "$req" >/dev/null 2>&1; then
            log_telemetry "runtime_assertion" "CRITICAL" '{"missing_binary":"'"$req"'"}'
            return 1
        fi
    done
}

# --- ACTION: DEPENDENCY_SYNC ---
action_sync_dependencies() {
    find "$PROJECT_ROOT" -maxdepth 3 -name "package.json" -not -path "*/node_modules/*" -print0 | xargs -0 -I {} -P 4 bash -c '
        dir=$(dirname "{}")
        (cd "$dir" && bun install --quiet --frozen-lockfile)
    '
}

# --- ACTION: FRONTEND_COMPILATION ---
action_compile_frontend() {
    if [[ -f "$PROJECT_ROOT/next.config.js" || -f "$PROJECT_ROOT/next.config.mjs" ]]; then
        (
            cd "$PROJECT_ROOT"
            export NEXT_TELEMETRY_DISABLED=1
            bun run build
            if [[ -d ".next/standalone" ]]; then
                cp -r .next/standalone/. "$BUNDLE_PATH/"
                [[ -d ".next/static" ]] && mkdir -p "$BUNDLE_PATH/.next" && cp -r .next/static "$BUNDLE_PATH/.next/"
                [[ -d "public" ]] && cp -r public "$BUNDLE_PATH/"
            fi
        )
    fi
}

# --- ACTION: MICRO_SERVICE_SYNTHESIS ---
action_compile_services() {
    local services=()
    while IFS= read -r -d '' pkg; do
        local dir; dir=$(dirname "$pkg")
        [[ "$dir" == "$PROJECT_ROOT" ]] && continue
        
        local name; name=$(basename "$dir")
        local entry=""; for e in "index.ts" "src/index.ts" "main.ts" "server.js"; do
            [[ -f "$dir/$e" ]] && entry="$dir/$e" && break
        done

        if [[ -n "$entry" ]]; then
            (
                cd "$dir"
                bun build "$entry" --outfile "$BUNDLE_PATH/services/$name.js" \
                    --target node --minify --sourcemap=external \
                    --define "process.env.GENKIT_TRACE_ID=\"$TRACE_ID\""
            )
            services+=("\"$name\"")
        fi
    done < <(find "$PROJECT_ROOT" -maxdepth 3 -name "package.json" -not -path "*/node_modules/*" -print0)
    
    printf '{"v":"3.1","traceId":"%s","services":[%s]}' "$TRACE_ID" "$(IFS=,; echo "${services[*]}")" > "$SERVICE_MANIFEST"
}

# --- ACTION: SCHEMA_PROJECTION ---
action_project_schema() {
    local schema; schema=$(find "$PROJECT_ROOT" -name "schema.prisma" -not -path "*/node_modules/*" | head -n 1)
    if [[ -n "$schema" ]]; then
        (cd "$(dirname "$schema")" && bun x prisma generate)
        cp "$schema" "$BUNDLE_PATH/schema.prisma"
        [[ -d "$(dirname "$schema")/node_modules" ]] && cp -r "$(dirname "$schema")/node_modules" "$BUNDLE_PATH/"
    fi
}

# --- ACTION: ARTIFACT_SEALING ---
action_seal_artifact() {
    local output="${ARTIFACT_ROOT}/genkit-release-${TRACE_ID}.tar.gz"
    
    cat <<'EOF' > "$BUNDLE_PATH/entrypoint.sh"
#!/usr/bin/env bash
set -e
export GENKIT_BOOT_TIME=$(date +%s)
pids=()

_signal_handler() {
    echo "[GENKIT] Terminating sub-processes..."
    for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done
    exit 0
}

trap _signal_handler SIGINT SIGTERM

echo "[GENKIT] Initializing High-Order Services..."
[[ -f "server.js" ]] && node server.js & pids+=($!)

for s in services/*.js; do
    echo "[BOOT] Service: $s"
    node "$s" & pids+=($!)
done

wait "${pids[@]}"
EOF
    chmod +x "$BUNDLE_PATH/entrypoint.sh"
    tar -czf "$output" -C "$BUNDLE_PATH" .
    log_telemetry "sealing" "SUCCESS" '{"artifact_path":"'"$output"'"}'
}

# --- FLOW: ARCHITECTURAL_PRECISION_PIPELINE ---
run_genkit_pipeline() {
    log_telemetry "pipeline_init" "SUCCESS" '{"root":"'"$PROJECT_ROOT"'","trace":"'"$TRACE_ID"'"}'

    local pipeline=(
        "workspace:prune|action_prune_workspace"
        "runtime:validate|action_validate_runtime"
        "dependencies:sync|action_sync_dependencies"
        "frontend:compile|action_compile_frontend"
        "services:compile|action_compile_services"
        "schema:project|action_project_schema"
        "artifact:seal|action_seal_artifact"
    )

    for step in "${pipeline[@]}"; do
        IFS="|" read -r sid fn <<< "$step"
        invoke_action "$sid" "$fn" || {
            log_telemetry "pipeline_aborted" "FATAL" '{"failed_step":"'"$sid"'"}'
            exit 1
        }
    done

    log_telemetry "pipeline_terminal" "SUCCESS" '{"status":"Architectural Precision Achieved"}'
}

run_genkit_pipeline "$@"