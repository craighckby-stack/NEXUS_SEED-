#!/usr/bin/env bash
set -euo pipefail

export GENKIT_VERSION="1.3.1-nexus"
export BUNDLE_PATH="${BUNDLE_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
export GENKIT_CONFIG_DIR="${GENKIT_CONFIG_DIR:-$BUNDLE_PATH/.genkit}"
export SERVICE_MANIFEST="$BUNDLE_PATH/service_manifest.json"
export TRACE_ID="${TRACE_ID:-$(date +%s%N | cut -b1-16)}"
export NODE_ENV="${NODE_ENV:-production}"
export GENKIT_ENV="${GENKIT_ENV:-$NODE_ENV}"
export GENKIT_LOG_LEVEL="${GENKIT_LOG_LEVEL:-info}"
export GENKIT_TELEMETRY_SERVER="${GENKIT_TELEMETRY_SERVER:-}"
export GENKIT_OTEL_EXPORT_INTERVAL=5000
export PORT=${PORT:-3000}

declare -a PIDS=()
declare -A SERVICE_REGISTRY

genkit_otel_emit() {
    local type=$1 op=$2 status=$3 meta=$4 severity=${5:-INFO}
    local payload
    payload=$(printf '{"resource":{"attributes":{"service.name":"genkit-nexus","service.version":"%s","deployment.environment":"%s"}},"span":{"traceId":"%s","name":"%s","kind":"INTERNAL","status":"%s","attributes":{"genkit.op":"%s","genkit.type":"%s","meta":%s},"severityText":"%s","timestamp":"%s"}}' \
        "$GENKIT_VERSION" "$GENKIT_ENV" "$TRACE_ID" "$op" "$status" "$op" "$type" "$meta" "$severity" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")")
    
    echo "$payload"
    if [[ -n "$GENKIT_TELEMETRY_SERVER" ]]; then
        curl -s -m 2 -X POST -H "Content-Type: application/json" -d "$payload" "$GENKIT_TELEMETRY_SERVER" >/dev/null 2>&1 || true
    fi
}

_nexus_terminate() {
    genkit_otel_emit "lifecycle" "shutdown" "INITIATED" "{\"active_nodes\":${#PIDS[@]}}" "WARN"
    [[ ${#PIDS[@]} -eq 0 ]] && exit 0

    kill -TERM "${PIDS[@]}" 2>/dev/null || true
    
    local grace=10
    while [ $grace -gt 0 ] && [ ${#PIDS[@]} -gt 0 ]; do
        local active=()
        for pid in "${PIDS[@]}"; do
            kill -0 "$pid" 2>/dev/null && active+=("$pid")
        done
        PIDS=("${active[@]}")
        [[ ${#PIDS[@]} -eq 0 ]] && break
        sleep 1
        ((grace--))
    done

    [[ ${#PIDS[@]} -gt 0 ]] && kill -9 "${PIDS[@]}" 2>/dev/null || true
    genkit_otel_emit "lifecycle" "shutdown" "TERMINATED" "{\"residue\":${#PIDS[@]}}" "INFO"
    exit 0
}

trap _nexus_terminate SIGINT SIGTERM

resource_initialize() {
    for bin in node bun caddy; do
        command -v "$bin" >/dev/null 2>&1 || {
            genkit_otel_emit "resource" "validate" "MISSING" "{\"binary\":\"$bin\"}" "ERROR"
            return 1
        }
    done
    mkdir -p "$BUNDLE_PATH/logs" "$GENKIT_CONFIG_DIR"
    
    local state_src="$BUNDLE_PATH/next-service-dist/db"
    [[ -d "$state_src" ]] && {
        mkdir -p "/db"
        cp -ru "$state_src"/* "/db/" 2>/dev/null || true
    }
}

plugin_sync_registry() {
    SERVICES=()
    if [[ -f "$SERVICE_MANIFEST" ]]; then
        mapfile -t SERVICES < <(node -e "
            try {
                const m = require('$SERVICE_MANIFEST');
                (Array.isArray(m.services) ? m.services : []).forEach(s => console.log(typeof s === 'string' ? s : s.id));
            } catch(e) { process.exit(1); }
        ")
        genkit_otel_emit "registry" "sync" "SUCCESS" "{\"count\":${#SERVICES[@]}}" "INFO"
    fi
}

_spawn_node() {
    local id=$1 cmd=$2 log_path=$3
    genkit_otel_emit "process" "spawn" "STARTING" "{\"id\":\"$id\"}" "DEBUG"
    
    eval "GENKIT_TRACE_ID=$TRACE_ID GENKIT_ENV=$GENKIT_ENV $cmd >> $log_path 2>&1 &"
    local pid=$!
    
    PIDS+=("$pid")
    SERVICE_REGISTRY[$pid]="$id"
    genkit_otel_emit "process" "spawn" "RUNNING" "{\"id\":\"$id\",\"pid\":$pid,\"log\":\"$log_path\"}" "INFO"
}

nexus_orchestrate() {
    local logs="$BUNDLE_PATH/logs"

    [[ -f "$BUNDLE_PATH/next-service-dist/server.js" ]] && \
        _spawn_node "gateway" "cd $BUNDLE_PATH/next-service-dist && bun server.js" "$logs/gateway.log"

    [[ -f "$BUNDLE_PATH/mini-services-start.sh" ]] && \
        _spawn_node "bus" "sh $BUNDLE_PATH/mini-services-start.sh" "$logs/bus.log"

    for sid in "${SERVICES[@]:-}"; do
        local bin="$BUNDLE_PATH/services/${sid}.js"
        [[ -f "$bin" ]] && _spawn_node "svc:$sid" "GENKIT_SERVICE_NAME=$sid node $bin" "$logs/svc_${sid}.log"
    done

    [[ -f "$BUNDLE_PATH/Caddyfile" ]] && \
        _spawn_node "ingress" "caddy run --config $BUNDLE_PATH/Caddyfile --adapter caddyfile" "$logs/ingress.log"

    [[ ${#PIDS[@]} -gt 0 ]] || return 1
    genkit_otel_emit "nexus" "orchestration" "STABLE" "{\"active_nodes\":${#PIDS[@]}}" "INFO"

    while true; do
        for pid in "${PIDS[@]}"; do
            if ! kill -0 "$pid" 2>/dev/null; then
                local name="${SERVICE_REGISTRY[$pid]:-unknown}"
                genkit_otel_emit "nexus" "fault" "CRASH" "{\"id\":\"$name\",\"pid\":$pid}" "FATAL"
                _nexus_terminate
            fi
        done
        sleep 5
    done
}

genkit_flow_main() {
    genkit_otel_emit "flow" "main" "START" "{\"bundle\":\"$BUNDLE_PATH\"}" "INFO"

    local stages=(
        "init|resource_initialize"
        "sync|plugin_sync_registry"
        "orchestrate|nexus_orchestrate"
    )

    for stage in "${stages[@]}"; do
        IFS="|" read -r id fn <<< "$stage"
        $fn || {
            genkit_otel_emit "flow" "main" "FAILED" "{\"stage\":\"$id\"}" "FATAL"
            exit 1
        }
    done
}

genkit_flow_main "$@"