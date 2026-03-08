#!/usr/bin/env bash

# [DALEK_CAAN SIPHON ENGINE v3.1]
# ARCHITECTURAL PRECISION: Google/Genkit Pattern Siphon
# MODULE: GENKIT_FLOW_ORCHESTRATOR
# EVOLUTION: ROUND 3/5

set -euo pipefail

# --- GENKIT INTERNAL REGISTRY & CONFIGURATION ---
readonly GENKIT_VERSION="v0.5.x-siphon"
readonly TRACE_ID="genkit-$(date +%s)-$(head /dev/urandom | tr -dc a-z0-9 | head -c 8)"
readonly PROJECT_ROOT="${NEXTJS_PROJECT_DIR:-$(pwd)}"
readonly ARTIFACT_ROOT="${ARTIFACT_DIR:-/tmp/genkit_builds/${TRACE_ID}}"
readonly DEPLOY_PATH="${ARTIFACT_ROOT}/bundle"

# --- OPEN TELEMETRY INTERFACE (GENKIT COMPLIANT) ---
telemetry_emit() {
    local span_name=$1
    local status=$2
    local metadata=$3
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    
    printf '{"time":"%s","traceId":"%s","spanName":"%s","status":"%s","attr":%s}\n' \
        "$timestamp" "$TRACE_ID" "$span_name" "$status" "${metadata:-{}}"
}

# --- ACTION RUNNER (FLOW CONTROL) ---
run_flow_step() {
    local action_id=$1
    local action_fn=$2
    
    telemetry_emit "$action_id" "STARTED" '{"version":"'"$GENKIT_VERSION"'"}'
    
    if $action_fn; then
        telemetry_emit "$action_id" "SUCCESS" '{}'
    else
        local err_code=$?
        telemetry_emit "$action_id" "ERROR" '{"exitCode":'"$err_code"'}'
        exit "$err_code"
    fi
}

# --- PLUGIN: ENVIRONMENT PREFLIGHT ---
plugin_preflight_check() {
    [[ ! -d "$PROJECT_ROOT" ]] && return 1
    mkdir -p "$DEPLOY_PATH"
    
    command -v bun >/dev/null 2>&1 || { echo "ERROR: bun runtime missing"; return 1; }
    
    cat > "${ARTIFACT_ROOT}/manifest.genkit.json" <<EOF
{
  "traceId": "$TRACE_ID",
  "engine": "DALEK_CAAN_V3.1",
  "schemaVersion": "1.0",
  "project": "$PROJECT_ROOT"
}
EOF
}

# --- PLUGIN: NEXTJS PROVIDER ---
plugin_nextjs_build() {
    export NEXT_TELEMETRY_DISABLED=1
    cd "$PROJECT_ROOT"

    bun install --frozen-lockfile --quiet
    bun run build

    if [[ -d ".next/standalone" ]]; then
        local target="${DEPLOY_PATH}/server"
        mkdir -p "$target"
        cp -r .next/standalone/. "$target/"
        [[ -d ".next/static" ]] && mkdir -p "$target/.next" && cp -r .next/static "$target/.next/"
        [[ -d "public" ]] && cp -r public "$target/"
    else
        return 1
    fi
}

# --- PLUGIN: SERVICE COMPOSITION ---
plugin_service_siphon() {
    local services_dir="$PROJECT_ROOT/mini-services"
    [[ ! -d "$services_dir" ]] && return 0

    for script in "install.sh" "build.sh"; do
        if [[ -f "$PROJECT_ROOT/.zscripts/mini-services-$script" ]]; then
            /usr/bin/env bash "$PROJECT_ROOT/.zscripts/mini-services-$script"
        fi
    done

    if [[ -f "$PROJECT_ROOT/.zscripts/mini-services-start.sh" ]]; then
        cp "$PROJECT_ROOT/.zscripts/mini-services-start.sh" "${DEPLOY_PATH}/"
    fi
}

# --- PLUGIN: PERSISTENCE LAYER (PRISMA/DRIZZLE) ---
plugin_schema_projection() {
    if [[ -f "package.json" ]] && grep -q "db:push" package.json; then
        DATABASE_URL="file:${DEPLOY_PATH}/genkit_state.db" bun run db:push
    fi
}

# --- PLUGIN: BUNDLE EXPORT ---
plugin_finalize_artifact() {
    local start_script="$PROJECT_ROOT/.zscripts/start.sh"
    
    if [[ -f "$start_script" ]]; then
        cp "$start_script" "${DEPLOY_PATH}/entrypoint.sh"
    else
        cat > "${DEPLOY_PATH}/entrypoint.sh" <<EOF
#!/usr/bin/env bash
node server/server.js
EOF
    fi
    
    chmod +x "${DEPLOY_PATH}/entrypoint.sh"
    tar -czf "${ARTIFACT_ROOT}/release-bundle.tar.gz" -C "$DEPLOY_PATH" .
    
    echo "GENKIT_ARTIFACT_URL=${ARTIFACT_ROOT}/release-bundle.tar.gz"
}

# --- FLOW DEFINITION (GENKIT MAIN) ---
define_build_flow() {
    telemetry_emit "GENKIT_ORCHESTRATOR" "INIT" '{"mode":"siphon"}'

    run_flow_step "action:preflight" plugin_preflight_check
    run_flow_step "action:frontend" plugin_nextjs_build
    run_flow_step "action:services" plugin_service_siphon
    run_flow_step "action:schema" plugin_schema_projection
    run_flow_step "action:finalize" plugin_finalize_artifact

    telemetry_emit "GENKIT_ORCHESTRATOR" "COMPLETE" '{"status":"ARCHITECTURAL_PRECISION_ACHIEVED"}'
}

# EXECUTE FLOW
define_build_flow "$@"