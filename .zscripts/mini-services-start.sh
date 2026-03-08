#!/usr/bin/env bash
set -e

# --- GENKIT NEXUS CONFIGURATION ---
export GENKIT_VERSION="1.2.0-siphon"
export BUNDLE_PATH="${BUNDLE_PATH:-./genkit_bundle}"
export SERVICE_MANIFEST="$BUNDLE_PATH/service_manifest.json"
export TRACE_ID="${TRACE_ID:-$(date +%s%N | cut -b1-16)}"
export NODE_ENV=production

PIDS=()

# --- OP: TELEMETRY_ENGINE ---
# Implements high-order observability patterns for Genkit flow tracking
genkit_telemetry_emit() {
    local op=$1 status=$2 meta=$3
    local timestamp; timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    printf '{"ts":"%s","op":"%s","status":"%s","traceId":"%s","v":"%s","meta":%s}\n' \
        "$timestamp" "$op" "$status" "$TRACE_ID" "$GENKIT_VERSION" "$meta"
}

# --- OP: KERNEL_INVOKER ---
genkit_invoke_op() {
    local op_id=$1 op_fn=$2
    genkit_telemetry_emit "$op_id" "START" "{}"
    if $op_fn; then
        genkit_telemetry_emit "$op_id" "COMPLETED" "{}"
    else
        genkit_telemetry_emit "$op_id" "FAILED" '{"error":"execution_interrupted"}'
        return 1
    fi
}

# --- OP: SIGNAL_RECEPTOR ---
_terminate() {
    genkit_telemetry_emit "nexus_shutdown" "INIT" '{"active_pids":['"$(IFS=,; echo "${PIDS[*]}")"']}'
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill -TERM "$pid" 2>/dev/null
        fi
    done
    
    local timeout=5
    while [ $timeout -gt 0 ] && [ ${#PIDS[@]} -gt 0 ]; do
        local still_running=()
        for pid in "${PIDS[@]}"; do
            kill -0 "$pid" 2>/dev/null && still_running+=("$pid")
        done
        PIDS=("${still_running[@]}")
        [[ ${#PIDS[@]} -eq 0 ]] && break
        sleep 1
        ((timeout--))
    done

    for pid in "${PIDS[@]}"; do
        kill -9 "$pid" 2>/dev/null || true
    done

    genkit_telemetry_emit "nexus_shutdown" "SUCCESS" "{}"
    exit 0
}

trap _terminate SIGINT SIGTERM

# --- OP: RUNTIME_ASSERTION ---
op_validate_environment() {
    if [[ ! -d "$BUNDLE_PATH" ]]; then
        genkit_telemetry_emit "runtime_check" "CRITICAL" '{"missing_dir":"'"$BUNDLE_PATH"'"}'
        return 1
    fi
    if ! command -v node >/dev/null 2>&1; then
        genkit_telemetry_emit "runtime_check" "CRITICAL" '{"missing_bin":"node"}'
        return 1
    fi
}

# --- OP: MANIFEST_SYNTHESIS ---
op_load_manifest() {
    if [[ ! -f "$SERVICE_MANIFEST" ]]; then
        genkit_telemetry_emit "discovery" "ERROR" '{"reason":"manifest_missing"}'
        return 1
    fi
    # Siphon service list from JSON manifest using node/grep pattern
    SERVICES=($(node -e "const m = require('$SERVICE_MANIFEST'); console.log(m.services.join(' '))"))
    if [[ ${#SERVICES[@]} -eq 0 ]]; then
        genkit_telemetry_emit "discovery" "IDLE" '{"count":0}'
        return 1
    fi
}

# --- OP: NEXUS_ACTIVATION ---
op_activate_services() {
    # Check for primary standalone entrypoint (Next.js/Monolith)
    if [[ -f "$BUNDLE_PATH/server.js" ]]; then
        genkit_telemetry_emit "spawn" "PRIMARY" '{"type":"standalone"}'
        (cd "$BUNDLE_PATH" && node server.js) >> "$BUNDLE_PATH/nexus_primary.log" 2>&1 &
        PIDS+=($!)
    fi

    # Activate discovered Micro-services
    for svc_id in "${SERVICES[@]}"; do
        local svc_path="$BUNDLE_PATH/services/${svc_id}.js"
        if [[ -f "$svc_path" ]]; then
            # Inject Genkit Context DNA via Environment
            GENKIT_SERVICE_ID="$svc_id" \
            GENKIT_TRACE_ID="$TRACE_ID" \
            node "$svc_path" >> "$BUNDLE_PATH/svc_${svc_id}.log" 2>&1 &
            
            local pid=$!
            sleep 0.2
            if kill -0 "$pid" 2>/dev/null; then
                PIDS+=("$pid")
                genkit_telemetry_emit "spawn" "SUCCESS" '{"id":"'"$svc_id"'","pid":'"$pid"'}'
            else
                genkit_telemetry_emit "spawn" "FAILED" '{"id":"'"$svc_id"'"}'
            fi
        fi
    done

    if [[ ${#PIDS[@]} -gt 0 ]]; then
        genkit_telemetry_emit "nexus_state" "ACTIVE" '{"nodes":'${#PIDS[@]}'}'
        wait
    else
        genkit_telemetry_emit "nexus_state" "HALT" '{"error":"zero_active_nodes"}'
        return 1
    fi
}

# --- SIPHON ENGINE EXECUTION FLOW ---
execute_genkit_pipeline() {
    genkit_telemetry_emit "pipeline_init" "INIT" '{"bundle":"'"$BUNDLE_PATH"'"}'

    local pipeline=(
        "runtime:assert|op_validate_environment"
        "manifest:load|op_load_manifest"
        "nexus:activate|op_activate_services"
    )

    for stage in "${pipeline[@]}"; do
        IFS="|" read -r sid fn <<< "$stage"
        genkit_invoke_op "$sid" "$fn" || {
            genkit_telemetry_emit "pipeline_crash" "FATAL" '{"stage":"'"$sid"'"}'
            exit 1
        }
    done
}

execute_genkit_pipeline "$@"