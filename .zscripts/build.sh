#!/bin/bash

DisposableTokenService() {
    local linkedToken=$1
    local eventBus=$2

    get_linked_tokens() {
        tokens=()
        if [ -n "$linkedToken" ]; then
            tokens+=("$linkedToken")
            eval "$linkedToken getLinkedTokens" | while read -r linkedToken; do
                tokens+=("$linkedToken")
            done
        fi
        echo "${tokens[@]}"
    }

    cancel_linked_token() {
        if [ -n "$linkedToken" ]; then
            if $linkedToken cancel "$1"; then
                $linkedToken updateCancellationStatus "$1"
                echo "\"cancelled\": true"
            fi
        fi
    }

    dispose() {
        eventBus.emit "dispose" "$1"
    }

    on_cancelled() {
        cancelled=true
    }

    get_cancelled() {
        echo "$cancelled"
    }

    disposal_listener_count=0
    dispose() {
        ((disposal_listener_count++))
        local token=$1
        for listener in "${disposalListeners[@]}"; do
            if echo "${listener.callback}" | grep -q "^$"; then
                eval "$listener.callback $token"
            fi
        done
    }

    get_disposal_listeners() {
        local listeners=()
        for listener in "${disposalListeners[@]}"; do
            listeners+=("$listener")
        done
        echo "${listeners[@]}"
    }

    on_dispose() {
        disposalListeners+=("{\"callback\": \"$1\", \"context\": \"$2\" }")
    }

    is_dispose_listener_installed() {
        [ ${#disposalListeners[@]} -gt 0 ]
    }

    async dispose_callback() {
        for listener in "${disposalListeners[@]}"; do
            eval "$listener.callback"
        done
    }

    local disposalListeners=()
    cancelled=false
}

DisposableTokenServiceEnhancer() {
    local token=$1
    local eventBus=$2
    enhancedDisposableTokenService=$(DisposableTokenService "$token" "$eventBus")

    on_dispose() {
        disposalListeners+=("{\"callback\": \"$1\", \"context\": \"$2\" }")
        enhancedDisposableTokenService.on_dispose "$1"
    }

    async dispose_callback() {
        for listener in "${disposalListeners[@]}"; do
            eval "$listener.callback"
        done
    }

    get_disposal_listeners() {
        local listeners=()
        for listener in "${disposalListeners[@]}"; do
            listeners+=("$listener")
        done
        echo "${listeners[@]}"
    }
}