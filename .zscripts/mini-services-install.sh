#!/usr/bin/env bash
set -euo pipefail

# --- GENKIT_CAAN ARCHITECTURAL SPECIFICATION [v3.1] ---
export GENKIT_ENV="${GENKIT_ENV:-production}"
export GENKIT_TRACE_LEVEL="${GENKIT_TRACE_LEVEL:-DEBUG}"
export GENKIT_VERSION="1.0.0-nexus"

PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
ARTIFACT_ROOT="${ARTIFACT_ROOT:-$PROJECT_ROOT/dist}"
BUNDLE_PATH="${BUNDLE_PATH:-$PROJECT_ROOT/.genkit_bundle}"
SERVICE_MANIFEST="$BUNDLE_PATH/genkit-manifest.json"
TRACE_ID=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32 ; echo '')

# --- GENKIT TELEMETRY ENGINE ---
genkit_telemetry_emit() {
    local stage=$1 status=$2 payload=$3
    printf '{"v":"%s","traceId":"%s","timestamp":"%s","stage":"%s","status":"%s","data":%s}\n' \
        "$GENKIT_VERSION" "$TRACE_ID" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$stage" "$status" "$payload" >&2
}

genkit_invoke_op() {
    local op_id=$1 op_fn=$2
    local start; start=$(date +%s%3N)
    genkit_telemetry_emit "$op_id" "START" '{"fn":"'"$op_fn"'"}'
    
    if $op_fn; then
        local end; end=$(date +%s%3N)
        genkit_telemetry_emit "$op_id" "COMPLETED" '{"latency_ms":'"$((end - start))"'}'
    else
        genkit_telemetry_emit "$op_id" "FAILED" '{"error":"execution_interrupted"}'
        return 1
    fi
}

# --- OP: ENTROPY_PRUNING ---
op_prune_entropy() {
    find "$PROJECT_ROOT" -maxdepth 2 -type d \( -name ".next" -o -name "node_modules" -o -name ".turbo" -o -name ".genkit_bundle" \) -exec rm -rf {} +
    find "$PROJECT_ROOT" -name "*.log" -type f -delete
    mkdir -p "$BUNDLE_PATH/services" "$ARTIFACT_ROOT"
}

# --- OP: RUNTIME_ASSERTION ---
op_validate_environment() {
    local core_bins=("bun" "node" "tar")
    for bin in "${core_bins[@]}"; do
        if ! command -v "$bin" >/dev/null 2>&1; then
            genkit_telemetry_emit "runtime_check" "CRITICAL" '{"missing":"'"$bin"'"}'
            return 1
        fi
    done
}

# --- OP: DEPENDENCY_SYNTHESIS ---
op_sync_dependencies() {
    find "$PROJECT_ROOT" -maxdepth 3 -name "package.json" -not -path "*/node_modules/*" -print0 | xargs -0 -I {} -P 4 bash -c '
        dir=$(dirname "{}")
        (cd "$dir" && bun install --quiet --frozen-lockfile --production)
    '
}

# --- OP: FRONTEND_FLUIDITY ---
op_compile_frontend() {
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

# --- OP: MICRO_SERVICE_EXTRACTION ---
op_compile_services() {
    local discovered_services=()
    while IFS= read -r -d '' pkg; do
        local svc_dir; svc_dir=$(dirname "$pkg")
        [[ "$svc_dir" == "$PROJECT_ROOT" ]] && continue
        
        local svc_id; svc_id=$(basename "$svc_dir")
        local entry=""; for e in "index.ts" "src/index.ts" "main.ts" "server.js"; do
            [[ -f "$svc_dir/$e" ]] && entry="$svc_dir/$e" && break
        done

        if [[ -n "$entry" ]]; then
            (
                cd "$svc_dir"
                bun build "$entry" --outfile "$BUNDLE_PATH/services/$svc_id.js" \
                    --target node --minify --sourcemap=none \
                    --define "process.env.GENKIT_TRACE_ID=\"$TRACE_ID\"" \
                    --define "process.env.GENKIT_SERVICE_ID=\"$svc_id\""
            )
            discovered_services+=("\"$svc_id\"")
        fi
    done < <(find "$PROJECT_ROOT" -maxdepth 3 -name "package.json" -not -path "*/node_modules/*" -print0)
    
    printf '{"v":"%s","traceId":"%s","services":[%s]}' "$GENKIT_VERSION" "$TRACE_ID" "$(IFS=,; echo "${discovered_services[*]}")" > "$SERVICE_MANIFEST"
}

# --- OP: SCHEMA_PROJECTION ---
op_project_schema() {
    local schema; schema=$(find "$PROJECT_ROOT" -name "schema.prisma" -not -path "*/node_modules/*" | head -n 1)
    if [[ -n "$schema" ]]; then
        (cd "$(dirname "$schema")" && bun x prisma generate)
        cp "$schema" "$BUNDLE_PATH/schema.prisma"
        [[ -d "$(dirname "$schema")/node_modules" ]] && cp -r "$(dirname "$schema")/node_modules" "$BUNDLE_PATH/"
    fi
}

# --- OP: ARTIFACT_SEALING ---
op_seal_nexus() {
    local output="${ARTIFACT_ROOT}/genkit-nexus-release-${TRACE_ID}.tar.gz"
    
    cat <<'EOF' > "$BUNDLE_PATH/entrypoint.sh"
#!/usr/bin/env bash
set -e
export GENKIT_BOOT_SEQUENCE=$(date +%s)
export NODE_ENV=production
pids=()

_terminate() {
    echo "[GENKIT] SIGTERM RECEIVED: Siphoning remaining cycles..."
    for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done
    exit 0
}

trap _terminate SIGINT SIGTERM

echo "[GENKIT] Activating Nexus-grade micro-services..."
[[ -f "server.js" ]] && node server.js & pids+=($!)

for service in services/*.js; do
    svc_name=$(basename "$service" .js)
    echo "[BOOT] Mounting: $svc_name"
    node "$service" & pids+=($!)
done

wait "${pids[@]}"
EOF
    chmod +x "$BUNDLE_PATH/entrypoint.sh"
    tar -czf "$output" -C "$BUNDLE_PATH" .
    genkit_telemetry_emit "sealing" "SUCCESS" '{"artifact":"'"$output"'"}'
}

# --- SIPHON ENGINE EXECUTION FLOW ---
execute_genkit_pipeline() {
    genkit_telemetry_emit "pipeline_init" "INIT" '{"root":"'"$PROJECT_ROOT"'"}'

    local pipeline=(
        "entropy:prune|op_prune_entropy"
        "runtime:assert|op_validate_environment"
        "deps:sync|op_sync_dependencies"
        "ui:compile|op_compile_frontend"
        "services:synthesize|op_compile_services"
        "schema:project|op_project_schema"
        "nexus:seal|op_seal_nexus"
    )

    for stage in "${pipeline[@]}"; do
        IFS="|" read -r sid fn <<< "$stage"
        genkit_invoke_op "$sid" "$fn" || {
            genkit_telemetry_emit "pipeline_crash" "FATAL" '{"stage":"'"$sid"'"}'
            exit 1
        }
    done

    genkit_telemetry_emit "pipeline_terminal" "SUCCESS" '{"architectural_precision":"100%"}'
}

execute_genkit_pipeline "$@"