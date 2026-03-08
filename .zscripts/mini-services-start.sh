#!/usr/bin/env bash
set -euo pipefail

export GENKIT_VERSION="1.3.0-nexus"
export BUNDLE_PATH="${BUNDLE_PATH:-./genkit_bundle}"
export SERVICE_MANIFEST="$BUNDLE_PATH/service_manifest.json"
export TRACE_ID="${TRACE_ID:-$(date +%s%N | cut -b1-16)}"
export NODE_ENV="${NODE_ENV:-production}"
export GENKIT_LOG_LEVEL="${GENKIT_LOG_LEVEL:-info}"
export GENKIT_TELEMETRY_SERVER="${GENKIT_TELEMETRY_SERVER:-}"

declare -a PIDS=()

genkit_telemetry_emit() {
    local op=$1 status=$2 meta=$3
    printf '{"ts":"%s","op":"%s","status":"%s","traceId":"%s","v":"%s","meta":%s}\n' \
        "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$op" "$status" "$TRACE_ID" "$GENKIT_VERSION" "$meta"
}

genkit_invoke_op() {
    local sid=$1 fn=$2
    genkit_telemetry_emit "$sid" "START" "{}"
    if $fn; then
        genkit_telemetry_emit "$sid" "COMPLETED" "{}"
    else
        genkit_telemetry_emit "$sid" "FAILED" "{\"error\":\"operation_interrupted\"}"
        return 1
    fi
}

_nexus_shutdown() {
    genkit_telemetry_emit "nexus_shutdown" "INIT" "{\"active_nodes\":${#PIDS[@]}}"
    [[ ${#PIDS[@]} -eq 0 ]] && exit 0

    kill -TERM "${PIDS[@]}" 2>/dev/null || true
    
    local timeout=15
    while [ $timeout -gt 0 ] && [ ${#PIDS[@]} -gt 0 ]; do
        local alive=()
        for pid in "${PIDS[@]}"; do
            kill -0 "$pid" 2>/dev/null && alive+=("$pid")
        done
        PIDS=("${alive[@]}")
        [[ ${#PIDS[@]} -eq 0 ]] && break
        sleep 1
        ((timeout--))
    done

    [[ ${#PIDS[@]} -gt 0 ]] && kill -9 "${PIDS[@]}" 2>/dev/null || true
    genkit_telemetry_emit "nexus_shutdown" "TERMINATED" "{\"force_killed\":${#PIDS[@]}}"
    exit 0
}

trap _nexus_shutdown SIGINT SIGTERM

op_runtime_check() {
    local deps=("node" "bun")
    for bin in "${deps[@]}"; do
        command -v "$bin" >/dev/null 2>&1 || return 1
    done
    [[ -d "$BUNDLE_PATH" ]] || return 1
}

op_registry_sync() {
    [[ -f "$SERVICE_MANIFEST" ]] || return 1
    mapfile -t SERVICES < <(node -e "
        try {
            const m = require('$SERVICE_MANIFEST');
            (m.services || []).forEach(s => console.log(s));
        } catch(e) { process.exit(1); }
    ")
    genkit_telemetry_emit "registry_sync" "SUCCESS" "{\"count\":${#SERVICES[@]}}"
}

op_nexus_orchestrate() {
    local log_dir="$BUNDLE_PATH/logs"
    mkdir -p "$log_dir"

    # Primary Entrypoint
    if [[ -f "$BUNDLE_PATH/server.js" ]]; then
        GENKIT_TRACE_ID="$TRACE_ID" \
        GENKIT_SERVICE_TYPE="primary" \
        node "$BUNDLE_PATH/server.js" >> "$log_dir/nexus_primary.log" 2>&1 &
        PIDS+=($!)
    fi

    # Discovered Micro-services
    for svc_id in "${SERVICES[@]:-}"; do
        local bin="$BUNDLE_PATH/services/${svc_id}.js"
        if [[ -f "$bin" ]]; then
            GENKIT_TRACE_ID="$TRACE_ID" \
            GENKIT_SERVICE_NAME="$svc_id" \
            GENKIT_SERVICE_TYPE="micro" \
            node "$bin" >> "$log_dir/svc_${svc_id}.log" 2>&1 &
            local pid=$!
            PIDS+=("$pid")
            genkit_telemetry_emit "node_spawn" "SUCCESS" "{\"id\":\"$svc_id\",\"pid\":$pid}"
        fi
    done

    [[ ${#PIDS[@]} -gt 0 ]] || return 1
    genkit_telemetry_emit "nexus_active" "STABLE" "{\"nodes\":${#PIDS[@]}}"
    
    # Nexus-grade Watchdog
    while true; do
        for pid in "${PIDS[@]}"; do
            if ! kill -0 "$pid" 2>/dev/null; then
                genkit_telemetry_emit "node_crash" "CRITICAL" "{\"pid\":$pid}"
                _nexus_shutdown
            fi
        done
        sleep 5
    done
}

execute_nexus_flow() {
    genkit_telemetry_emit "flow_init" "INIT" "{\"path\":\"$BUNDLE_PATH\"}"

    local pipeline=(
        "runtime:check|op_runtime_check"
        "registry:sync|op_registry_sync"
        "nexus:orchestrate|op_nexus_orchestrate"
    )

    for step in "${pipeline[@]}"; do
        IFS="|" read -r sid fn <<< "$step"
        genkit_invoke_op "$sid" "$fn" || {
            genkit_telemetry_emit "flow_abort" "FATAL" "{\"stage\":\"$sid\"}"
            exit 1
        }
    done
}

execute_nexus_flow "$@"