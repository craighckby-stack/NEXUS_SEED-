#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
TRACE_ID=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 12 ; echo '')

log_telemetry() {
    local event=$1 status=$2 data=$3
    printf '{"ts":"%s","traceId":"%s","event":"%s","status":"%s","data":%s}\n' \
        "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$TRACE_ID" "$event" "$status" "$data" >&2
}

invoke_action() {
    local id=$1 fn=$2
    log_telemetry "action_exec" "PENDING" '{"action":"'"$id"'"}'
    if $fn; then
        log_telemetry "action_exec" "SUCCESS" '{"action":"'"$id"'"}'
    else
        log_telemetry "action_exec" "FAILURE" '{"action":"'"$id"'"}'
        return 1
    fi
}

action_preflight_check() {
    local deps=("bun" "node")
    for tool in "${deps[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            log_telemetry "runtime_error" "MISSING_DEP" '{"binary":"'"$tool"'"}'
            return 1
        fi
    done
}

action_sync_dependencies() {
    local success_list=()
    local failure_list=()

    while IFS= read -r -d '' pkg_json; do
        local pkg_dir
        pkg_dir=$(dirname "$pkg_json")
        local pkg_name
        pkg_name=$(basename "$pkg_dir")

        log_telemetry "siphon_install" "PROCESSING" '{"pkg":"'"$pkg_name"'","path":"'"$pkg_dir"'"}'
        
        if (cd "$pkg_dir" && bun install --quiet --no-progress); then
            success_list+=("\"$pkg_name\"")
        else
            failure_list+=("\"$pkg_name\"")
        fi
    done < <(find "$PROJECT_ROOT" -maxdepth 3 -name "package.json" -not -path "*/node_modules/*" -print0)

    log_telemetry "batch_summary" "COMPLETE" \
        '{"success":['"$(IFS=,; echo "${success_list[*]}")"'],"failed":['"$(IFS=,; echo "${failure_list[*]}")"']}'
    
    [[ ${#failure_list[@]} -eq 0 ]]
}

define_siphon_flow() {
    log_telemetry "siphon_flow_init" "START" '{"root":"'"$PROJECT_ROOT"'"}'

    local flow=(
        "validate:runtime|action_preflight_check"
        "sync:dependencies|action_sync_dependencies"
    )

    for step in "${flow[@]}"; do
        IFS="|" read -r id fn <<< "$step"
        invoke_action "$id" "$fn" || {
            log_telemetry "siphon_flow_abort" "CRITICAL" '{"step":"'"$id"'"}'
            exit 1
        }
    done

    log_telemetry "siphon_flow_exit" "SUCCESS" '{"precision":"Nexus-grade"}'
}

define_siphon_flow "$@"