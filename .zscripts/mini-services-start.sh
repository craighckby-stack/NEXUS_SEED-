#!/usr/bin/env bash
set -e

# --- NEXUS CONFIGURATION ---
DIST_DIR="./mini-services-dist"
TRACE_ID="${TRACE_ID:-$(date +%s%N | cut -b1-16)}"
GENKIT_VERSION="1.2.0-siphon"
PIDS=()

# --- OP: TELEMETRY_ENGINE ---
genkit_telemetry_emit() {
    local op=$1 status=$2 meta=$3
    local timestamp; timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    printf '{"ts":"%s","op":"%s","status":"%s","traceId":"%s","meta":%s}\n' \
        "$timestamp" "$op" "$status" "$TRACE_ID" "$meta"
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
    
    # Graceful wait with timeout logic
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

    # Force purge remaining entropy
    for pid in "${PIDS[@]}"; do
        kill -9 "$pid" 2>/dev/null || true
    done

    genkit_telemetry_emit "nexus_shutdown" "SUCCESS" "{}"
    exit 0
}

trap _terminate SIGINT SIGTERM

# --- OP: RUNTIME_ASSERTION ---
op_validate_environment() {
    if [[ ! -d "$DIST_DIR" ]]; then
        genkit_telemetry_emit "runtime_check" "CRITICAL" '{"missing":"'"$DIST_DIR"'"}'
        return 1
    fi
    if ! command -v bun >/dev/null 2>&1; then
        genkit_telemetry_emit "runtime_check" "CRITICAL" '{"missing":"bun"}'
        return 1
    fi
}

# --- OP: SERVICE_DISCOVERY ---
op_discover_services() {
    SERVICES=($(find "$DIST_DIR" -maxdepth 1 -name "mini-service-*.js"))
    if [[ ${#SERVICES[@]} -eq 0 ]]; then
        genkit_telemetry_emit "discovery" "IDLE" '{"count":0}'
        return 1
    fi
}

# --- OP: NEXUS_ACTIVATION ---
op_activate_services() {
    for svc in "${SERVICES[@]}"; do
        local svc_id; svc_id=$(basename "$svc" .js | sed 's/mini-service-//')
        
        # Execute binary within restricted scope
        bun "$svc" >> "service-${svc_id}.log" 2>&1 &
        local pid=$!
        
        # Immediate health check
        sleep 0.3
        if kill -0 "$pid" 2>/dev/null; then
            PIDS+=("$pid")
            genkit_telemetry_emit "spawn" "SUCCESS" '{"id":"'"$svc_id"'","pid":'"$pid"'}'
        else
            genkit_telemetry_emit "spawn" "FAILED" '{"id":"'"$svc_id"'"}'
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
    genkit_telemetry_emit "pipeline_init" "INIT" '{"dist":"'"$DIST_DIR"'"}'

    local pipeline=(
        "runtime:assert|op_validate_environment"
        "svc:discovery|op_discover_services"
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