#!/usr/bin/env bash
set -e

# --- GENKIT NEXUS RUNTIME CONFIGURATION ---
export GENKIT_VERSION="1.3.0-nexus"
export BUNDLE_PATH="${BUNDLE_PATH:-./genkit_bundle}"
export SERVICE_MANIFEST="$BUNDLE_PATH/service_manifest.json"
export TRACE_ID="${TRACE_ID:-$(date +%s%N | cut -b1-16)}"
export NODE_ENV="${NODE_ENV:-production}"
export GENKIT_TELEMETRY_SERVER="${GENKIT_TELEMETRY_SERVER:-}"

PIDS=()

# --- OP: TELEMETRY_DISPATCHER ---
# Siphons Genkit-standard observability patterns for process lifecycle
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

# --- OP: SIGNAL_SUPERVISOR ---
_terminate() {
    genkit_telemetry_emit "nexus_shutdown" "INIT" '{"active_nodes":'${#PIDS[@]}'}'
    for pid in "${PIDS[@]}"; do
        kill -TERM "$pid" 2>/dev/null || true
    done
    
    local timeout=7
    while [ $timeout -gt 0 ] && [ ${#PIDS[@]} -gt 0 ]; do
        local remaining=()
        for pid in "${PIDS[@]}"; do
            kill -0 "$pid" 2>/dev/null && remaining+=("$pid")
        done
        PIDS=("${remaining[@]}")
        [[ ${#PIDS[@]} -eq 0 ]] && break
        sleep 1
        ((timeout--))
    done

    [[ ${#PIDS[@]} -gt 0 ]] && for pid in "${PIDS[@]}"; do kill -9 "$pid" 2>/dev/null || true; done

    genkit_telemetry_emit "nexus_shutdown" "TERMINATED" "{}"
    exit 0
}

trap _terminate SIGINT SIGTERM

# --- OP: RUNTIME_VALIDATION ---
op_validate_runtime() {
    local requirements=("node" "bun")
    for req in "${requirements[@]}"; do
        if ! command -v "$req" >/dev/null 2>&1; then
            genkit_telemetry_emit "runtime_check" "CRITICAL" '{"missing":"'"$req"'"}'
            return 1
        fi
    done
    [[ -d "$BUNDLE_PATH" ]] || { genkit_telemetry_emit "runtime_check" "CRITICAL" '{"missing_dir":"'"$BUNDLE_PATH"'"}' ; return 1; }
}

# --- OP: REGISTRY_HYDRATION ---
op_hydrate_registry() {
    if [[ ! -f "$SERVICE_MANIFEST" ]]; then
        genkit_telemetry_emit "registry_load" "ERROR" '{"reason":"manifest_not_found"}'
        return 1
    fi
    # Siphoning service array via Node.js high-speed JSON reflection
    SERVICES=($(node -e "try { const m = require('$SERVICE_MANIFEST'); console.log((m.services || []).join(' ')); } catch(e) { process.exit(1); }"))
    genkit_telemetry_emit "registry_load" "SUCCESS" '{"discovered":'${#SERVICES[@]}'}'
}

# --- OP: SERVICE_ORCHESTRATION ---
op_orchestrate_nexus() {
    # 1. Primary Standalone Node (Monolith/SSR)
    if [[ -f "$BUNDLE_PATH/server.js" ]]; then
        genkit_telemetry_emit "node_spawn" "PRIMARY" '{"id":"standalone"}'
        (cd "$BUNDLE_PATH" && node server.js) >> "$BUNDLE_PATH/primary.log" 2>&1 &
        PIDS+=($!)
    fi

    # 2. Micro-Service Mesh (Generated Bundles)
    for svc_id in "${SERVICES[@]}"; do
        local svc_path="$BUNDLE_PATH/services/${svc_id}.js"
        if [[ -f "$svc_path" ]]; then
            # Injecting Genkit Context into Process DNA
            GENKIT_TRACE_ID="$TRACE_ID" \
            GENKIT_SERVICE_NAME="$svc_id" \
            GENKIT_ENV="$NODE_ENV" \
            node "$svc_path" >> "$BUNDLE_PATH/svc_${svc_id}.log" 2>&1 &
            
            local pid=$!
            sleep 0.1 # Brief saturation delay
            if kill -0 "$pid" 2>/dev/null; then
                PIDS+=("$pid")
                genkit_telemetry_emit "node_spawn" "SUCCESS" '{"id":"'"$svc_id"'","pid":'"$pid"'}'
            else
                genkit_telemetry_emit "node_spawn" "CRITICAL" '{"id":"'"$svc_id"'","status":"failed_immediate"}'
            fi
        fi
    done

    if [[ ${#PIDS[@]} -eq 0 ]]; then
        genkit_telemetry_emit "orchestration" "HALT" '{"reason":"zero_active_nodes"}'
        return 1
    fi

    genkit_telemetry_emit "nexus_active" "STABLE" '{"total_nodes":'${#PIDS[@]}'}'
    wait
}

# --- SIPHON ENGINE PIPELINE ---
execute_nexus_flow() {
    genkit_telemetry_emit "pipeline_init" "INIT" '{"bundle":"'"$BUNDLE_PATH"'","trace":"'"$TRACE_ID"'"}'

    local pipeline=(
        "runtime:validate|op_validate_runtime"
        "registry:hydrate|op_hydrate_registry"
        "nexus:orchestrate|op_orchestrate_nexus"
    )

    for stage in "${pipeline[@]}"; do
        IFS="|" read -r sid fn <<< "$stage"
        genkit_invoke_op "$sid" "$fn" || {
            genkit_telemetry_emit "pipeline_crash" "FATAL" '{"failed_stage":"'"$sid"'"}'
            exit 1
        }
    done
}

execute_nexus_flow "$@"