#!/usr/bin/env bash
set -euo pipefail

# --- ENVIRONMENT CONFIGURATION ---
PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
ARTIFACT_ROOT="${ARTIFACT_ROOT:-$PROJECT_ROOT/dist}"
BUNDLE_PATH="${BUNDLE_PATH:-$PROJECT_ROOT/.genkit_bundle}"
SERVICE_MANIFEST="$BUNDLE_PATH/services.json"
TRACE_ID=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 12 ; echo '')

# --- GENKIT TELEMETRY ENGINE ---
log_telemetry() {
    local event=$1 status=$2 data=$3
    printf '{"ts":"%s","traceId":"%s","event":"%s","status":"%s","metadata":%s}\n' \
        "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$TRACE_ID" "$event" "$status" "$data" >&2
}

invoke_action() {
    local id=$1 fn=$2
    log_telemetry "action_lifecycle" "START" '{"action":"'"$id"'"}'
    if $fn; then
        log_telemetry "action_lifecycle" "SUCCESS" '{"action":"'"$id"'"}'
    else
        log_telemetry "action_lifecycle" "FAILURE" '{"action":"'"$id"'"}'
        return 1
    fi
}

# --- ACTION: ENTROPY REDUCTION ---
action_prune_entropy() {
    log_telemetry "pruning" "PROCESSING" '{"target":"cache_artifacts"}'
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

# --- ACTION: DEPENDENCY SYNCHRONIZATION ---
action_sync_dependencies() {
    while IFS= read -r -d '' pkg_json; do
        local dir
        dir=$(dirname "$pkg_json")
        (cd "$dir" && bun install --quiet --frozen-lockfile)
    done < <(find "$PROJECT_ROOT" -maxdepth 3 -name "package.json" -not -path "*/node_modules/*" -print0)
}

# --- ACTION: FRONTEND COMPILATION ---
action_compile_frontend() {
    if [[ -f "$PROJECT_ROOT/next.config.js" || -f "$PROJECT_ROOT/next.config.mjs" ]]; then
        (
            cd "$PROJECT_ROOT"
            export NEXT_TELEMETRY_DISABLED=1
            export NODE_ENV=production
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
    
    cat <<'EOF' > "$BUNDLE_PATH/entrypoint.sh"
#!/usr/bin/env bash
set -e
export GENKIT_RUNTIME_BOOT=$(date +%s)
pids=()
cleanup() {
    echo "[GENKIT] Terminating sub-processes..."
    for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done
    exit 0
}
trap cleanup SIGINT SIGTERM
[[ -f "server.js" ]] && node server.js & pids+=($!)
for svc in services/*.js; do
    node "$svc" &
    pids+=($!)
done
wait "${pids[@]}"
EOF
    chmod +x "$BUNDLE_PATH/entrypoint.sh"
    tar -czf "$output_file" -C "$BUNDLE_PATH" .
    log_telemetry "artifact_sealed" "SUCCESS" '{"path":"'"$output_file"'"}'
}

# --- MAIN: ARCHITECTURAL PIPELINE ---
execute_genkit_pipeline() {
    log_telemetry "pipeline_init" "SUCCESS" '{"root":"'"$PROJECT_ROOT"'"}'

    local pipeline=(
        "workspace:prune|action_prune_entropy"
        "runtime:validate|action_validate_runtime"
        "deps:sync|action_sync_dependencies"
        "frontend:compile|action_compile_frontend"
        "services:compile|action_compile_services"
        "schema:project|action_project_schema"
        "artifact:seal|action_seal_artifact"
    )

    for step in "${pipeline[@]}"; do
        IFS="|" read -r id fn <<< "$step"
        invoke_action "$id" "$fn" || {
            log_telemetry "pipeline_aborted" "FATAL" '{"failed_step":"'"$id"'"}'
            exit 1
        }
    done

    log_telemetry "pipeline_complete" "SUCCESS" '{"precision":"Nexus-grade"}'
}

execute_genkit_pipeline "$@"