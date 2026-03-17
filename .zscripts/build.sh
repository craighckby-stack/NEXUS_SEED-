#!/bin/bash

DisposableTokenService() {
    local linkedToken=$1
    local eventBus=$2
    local linkedTokens=()
    local disposalListeners=()

    linked_tokens() {
        tokens=()
        if [ -n "$linkedToken" ]; then
            tokens+=("$linkedToken")
            eval "$linkedToken getLinkedTokens" | while read -r linkedToken; do
                tokens+=("$linkedToken")
            done
        fi
        echo "${tokens[@]}"
    }

    cancel() {
        local reason=$1
        if [ -n "$linkedToken" ]; then
            if $linkedToken cancel "$reason" && $linkedToken cancelled; then
                $linkedToken updateCancellationStatus "$reason"
            fi
        fi
        echo "\"cancelled\": true"
    }

    cancel_token() {
        $1 cancel "$1" && echo "$1 cancelled"
    }

    disposal_listener_count=0
    dispose() {
        ((disposal_listener_count++))
        local token=$1
        eventBus.emit "dispose" "$token"
    }

    async cancel_linked_token() {
        if [ -n "$linkedToken" ]; then
            await cancel "$1"
        fi
    }

    cancelled=false
    on_cancelled() {
        cancelled=true
    }

    dispose() {
        ((disposal_listener_count++))
        local token=$1
        for listener in "${disposalListeners[@]}"; do
            if echo "${listener.callback}" | grep -q "^$"; then
                eval "$listener.callback $token"
            fi
        done
    }

    get_cancelled() {
        echo "$cancelled"
    }
}

DisposableTokenServiceEnhancer() {
    local token=$1
    local eventBus=$2
    local disposalListeners=()
    enhancedDisposableTokenService=$(DisposableTokenService "$token" "$eventBus")

    dispose() {
        disposalListeners+=("{\"callback\": \"$1\", \"context\": \"$2\" }")
        enhancedDisposableTokenService.dispose "$1"
    }

    has_any_listeners() {
        [ ${#disposalListeners[@]} -gt 0 ]
    }

    get_all_listeners() {
        local listeners=()
        for listener in "${disposalListeners[@]}"; do
            listeners+=("$listener")
        done
        echo "${listeners[@]}"
    }

    async dispose_callback() {
        for listener in "${disposalListeners[@]}"; do
            eval "$listener.callback"
        done
    }
}