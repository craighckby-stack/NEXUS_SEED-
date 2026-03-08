#!/usr/bin/env bash
set -euo pipefail

# --- GENKIT ENVIRONMENT CONFIGURATION ---
export GENKIT_ENV="${GENKIT_ENV:-production}"
export GENKIT_TELEMETRY_LEVEL="${GENKIT_TELEMETRY_LEVEL:-info}"
PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
ARTIFACT_ROOT="${ARTIFACT_ROOT:-$PROJECT_ROOT/dist}"
BUNDLE_PATH="${BUNDLE_PATH:-$PROJECT_ROOT/.genkit_bundle}"
SERVICE_MANIFEST="$BUNDLE_PATH/manifest.json"
TRACE_ID=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 16 ; echo '')

# --- TELEMETRY & OBSERVABILITY ENGINE ---
log_event() {
    local stage=$1 status=$2 meta=$3
    printf '{"timestamp":"%s","traceId":"%s","stage":"%s","status":"%s","metadata":%s}\n' \
        "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$TRACE_ID" "$stage" "$status" "$meta" >&2
}

run_flow_step() {
    local step_id=$1 fn_name=$2
    local start_ts; start_ts=$(date +%s%3N)
    log_event "$step_id" "STARTED" '{"fn":"'"$fn_name"'"}'
    
    if $fn_name; then
        local end_ts; end_ts=$(date +%s%3N)
        local duration=$((end_ts - start_ts))
        log_event "$step_id" "COMPLETED" '{"duration_ms":'"$duration"'}'
    else
        log_event "$step_id" "FAILED" '{"error":"execution_interrupted"}'
        return 1
    fi
}

# --- ACTION: ENVIRONMENT PURIFICATION ---
flow_prune_workspace() {
    log_event "pruning" "PROCESSING" '{"scope":"build_artifacts"}'
    find "$PROJECT_ROOT" -maxdepth 2 -type d \( -name ".next" -o -name "node_modules" -o -name ".turbo" \) -exec rm -rf {} +
    find "$PROJECT_ROOT" -name "*.log" -type f -delete
    mkdir -p "$BUNDLE_PATH/services" "$ARTIFACT_ROOT"
}

# --- ACTION: RUNTIME INTEROP VALIDATION ---
flow_validate_runtime() {
    local deps=("bun" "node" "tar")
    for tool in "${deps[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            log_event "validation" "CRITICAL" '{"missing":"'"$tool"'"}'
            return 1
        fi
    done
}

# --- ACTION: DEPENDENCY SYNCHRONIZATION ---
flow_sync_dependencies() {
    find "$PROJECT_ROOT" -maxdepth 3 -name "package.json" -not -path "*/node_modules/*" -print0 | xargs -0 -I {} bash -c '
        dir=$(dirname "{}")
        (cd "$dir" && bun install --quiet --frozen-lockfile)
    '
}

# --- ACTION: FRONTEND ARCHITECTURE BUILD ---
flow_compile_frontend() {
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

# --- ACTION: MICRO-SERVICE SYNTHESIS ---
flow_compile_services() {
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
    
    printf '{"version":"1.0","traceId":"%s","services":[%s]}' "$TRACE_ID" "$(IFS=,; echo "${services[*]}")" > "$SERVICE_MANIFEST"
}

# --- ACTION: SCHEMA & DATA PROJECTION ---
flow_project_schema() {
    local schema; schema=$(find "$PROJECT_ROOT" -name "schema.prisma" -not -path "*/node_modules/*" | head -n 1)
    if [[ -n "$schema" ]]; then
        (cd "$(dirname "$schema")" && bun x prisma generate)
        cp "$schema" "$BUNDLE_PATH/schema.prisma"
        [[ -d "$(dirname "$schema")/node_modules" ]] && cp -r "$(dirname "$schema")/node_modules" "$BUNDLE_PATH/"
    fi
}

# --- ACTION: ARTIFACT SEALING ---
flow_seal_bundle() {
    local output="${ARTIFACT_ROOT}/genkit-release-${TRACE_ID}.tar.gz"
    cat <<'EOF' > "$BUNDLE_PATH/entrypoint.sh"
#!/usr/bin/env bash
set -e
export GENKIT_BOOT_TIME=$(date +%s)
pids=()
_term() { 
    echo "[GENKIT] SIGTERM received. Shutting down..."; 
    for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done
    exit 0
}
trap _term SIGINT SIGTERM
[[ -f "server.js" ]] && node server.js & pids+=($!)
for s in services/*.js; do 
    echo "[BOOT] $s"
    node "$s" & pids+=($!)
done
wait "${pids[@]}"
EOF
    chmod +x "$BUNDLE_PATH/entrypoint.sh"
    tar -czf "$output" -C "$BUNDLE_PATH" .
    log_event "sealing" "SUCCESS" '{"artifact":"'"$output"'"}'
}

# --- ORCHESTRATOR: GENKIT INSTALLATION PIPELINE ---
execute_pipeline() {
    log_event "pipeline_init" "SUCCESS" '{"root":"'"$PROJECT_ROOT"'","env":"'"$GENKIT_ENV"'"}'

    local pipeline=(
        "workspace_prune|flow_prune_workspace"
        "runtime_check|flow_validate_runtime"
        "dependency_sync|flow_sync_dependencies"
        "frontend_build|flow_compile_frontend"
        "service_build|flow_compile_services"
        "schema_generate|flow_project_schema"
        "artifact_seal|flow_seal_bundle"
    )

    for step in "${pipeline[@]}"; do
        IFS="|" read -r sid fn <<< "$step"
        run_flow_step "$sid" "$fn" || exit 1
    done

    log_event "pipeline_complete" "SUCCESS" '{"precision":"Nexus-grade"}'
}

execute_pipeline "$@"