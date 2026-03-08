#!/usr/bin/env bash

set -e

# --- CONFIGURATION & RUNTIME STATE ---
readonly TRACE_ID="${BUILD_ID:-$(date +%s%N)}"
readonly ROOT_DIR="${MINI_SERVICES_ROOT:-/home/z/my-project/mini-services}"
readonly DIST_DIR="${MINI_SERVICES_DIST:-/tmp/build_fullstack_$TRACE_ID/mini-services-dist}"
readonly TELEMETRY_LOG="${DIST_DIR}/telemetry.jsonl"

# --- GENKIT TELEMETRY CORE ---
log_telemetry() {
    local span_name=$1 status=$2 metadata=$3
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    mkdir -p "$(dirname "$TELEMETRY_LOG")"
    printf '{"timestamp":"%s","traceId":"%s","spanName":"%s","status":"%s","attr":%s}\n' \
        "$timestamp" "$TRACE_ID" "$span_name" "$status" "${metadata:-{}}" >> "$TELEMETRY_LOG"
}

invoke_action() {
    local action_id=$1
    local action_fn=$2
    local start_ns
    start_ns=$(date +%s%N)

    log_telemetry "$action_id" "STARTED" '{"root":"'"$ROOT_DIR"'"}'

    if $action_fn; then
        local end_ns=$(date +%s%N)
        local duration_ms=$(( (end_ns - start_ns) / 1000000 ))
        log_telemetry "$action_id" "SUCCESS" '{"latency_ms":'"$duration_ms"'}'
    else
        local err_code=$?
        log_telemetry "$action_id" "ERROR" '{"exit_code":'"$err_code"'}'
        return "$err_code"
    fi
}

# --- ACTIONS: ARCHITECTURAL PRIMITIVES ---

action_prepare_env() {
    [[ ! -d "$ROOT_DIR" ]] && return 1
    mkdir -p "$DIST_DIR"
    return 0
}

resolve_entry_point() {
    local dir=$1
    for entry in "src/index.ts" "index.ts" "src/index.js" "index.js"; do
        if [[ -f "$dir/$entry" ]]; then
            echo "$dir/$entry"
            return 0
        fi
    done
    return 1
}

action_build_services() {
    local success=0
    local fail=0

    for dir in "$ROOT_DIR"/*; do
        [[ -d "$dir" && -f "$dir/package.json" ]] || continue
        
        local project_name
        project_name=$(basename "$dir")
        local entry_path
        entry_path=$(resolve_entry_point "$dir")

        if [[ -z "$entry_path" ]]; then
            log_telemetry "service_skip" "WARNING" '{"project":"'"$project_name"'","reason":"missing_entry"}'
            continue
        fi

        local output_file="$DIST_DIR/mini-service-$project_name.js"
        
        if bun build "$entry_path" --outfile "$output_file" --target bun --minify > /dev/null 2>&1; then
            log_telemetry "service_compile" "SUCCESS" '{"project":"'"$project_name"'","output":"'"$output_file"'"}'
            ((success++))
        else
            log_telemetry "service_compile" "ERROR" '{"project":"'"$project_name"'"}'
            ((fail++))
        fi
    done

    [[ $fail -eq 0 ]]
}

action_finalize_artifacts() {
    local start_script="./.zscripts/mini-services-start.sh"
    if [[ -f "$start_script" ]]; then
        cp "$start_script" "$DIST_DIR/mini-services-start.sh"
        chmod +x "$DIST_DIR/mini-services-start.sh"
    fi
}

# --- ORCHESTRATION ---

main() {
    local flow=(
        "env:prepare|action_prepare_env"
        "services:build|action_build_services"
        "artifacts:finalize|action_finalize_artifacts"
    )

    for step in "${flow[@]}"; do
        IFS="|" read -r id fn <<< "$step"
        invoke_action "$id" "$fn" || {
            echo "!! [FATAL] Flow failed at $id" >&2
            exit 1
        }
    done

    echo "BUILD_COMPLETE: $DIST_DIR"
}

main "$@"