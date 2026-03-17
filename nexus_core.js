**GROUNDING:**
The enhanced code is more complex and no longer maps directly to the original context. The introduction of `AsyncTokenFactory`, `DelayToken`, and `CancelTokenDecorator` classes adds unnecessary complexity and lack of mechanistic justification for `CancelTokenDecorator`.

**MECHANISM:**
The `AsyncTokenFactory` and `DelayToken` classes can be mechanistically justified. However, `CancelTokenDecorator` implies speculative behavior about token linking.

**DECORATION:**
The enhanced code is overloaded with excessive and purely decorative elements, such as the `emergentTool` and `tool` sections.

Based on the criteria, I must strip the unnecessary complexity and speculative behavior.

The stripped code is as follows:

export class DisposableToken {
  constructor(name) {
    this.#disposeCount = 1;
    this.#cancelled = false;
    this.#reason = null;
    this.#disposeListeners = [];
    this.#linkedToken = null;
    this.#name = name;
  }

  get disposeCount() {
    return this.#disposeCount;
  }

  cancel(reason = 'Operation aborted') {
    if (this.#cancelled) return;
    this.#cancelled = true;
    this.#reason = reason;
    for (const listener of this.#disposeListeners) {
      listener();
    }
    this.#disposeListeners = [];
    EventBus.emit('Cancel', reason);
    this.#linkedToken?.cancel(reason);
    queueMicrotask(() => {
      EventBus.emit('Destroyed', reason);
      this.#linkedToken = null;
    });
  }

  onCancellationRequested(callback) {
    this.#disposeListeners.push(callback);
    return this;
  }

  link(otherToken) {
    this.#linkedToken = otherToken;
  }

  throwIfCancelled() {
    if (this.#cancelled) throw new Error(this.#reason || 'Cancelled');
  }

  dispose() {
    this.cancel();
  }

  destroy() {
    EventBus.emit('Deleted', this.#name);
    if (this.#disposeCount > 0) {
      this.#disposeCount--;
    }
  }

  isCancelled() {
    return this.#cancelled;
  }
}

export class CancellationToken {
  constructor(parentToken) {
    this.#parentToken = parentToken;
    this.#linkedTokens = new Set();
  }

  cancel(reason = 'Operation aborted') {
    if (this.#cancelled) return;
    this.#cancelled = true;
    this.#reason = reason;
    for (const linkedToken of this.#linkedTokens) {
      linkedToken.cancel(reason);
    }
    EventBus.emit('Cancel', reason);
    queueMicrotask(() => {
      EventBus.emit('Destroyed', reason);
      this.#parentToken = null;
    });
  }

  throwIfCancelled() {
    throw new Error('Cancelled');
  }

  linkedTokens() {
    return this.#linkedTokens;
  }

  cancelEventDispatch() {
    EventBus.emit('CancelEventDispatch');
  }

  destroy() {
    this.#linkedTokens.clear();
  }
}

export class EventBus {
  constructor() {
    this.#listeners = new Map();
  }

  on(eventType, callback, payload) {
    const event = this.#listeners.get(eventType);
    if (event) {
      event.callback = callback;
      event.payload = payload;
    } else {
      this.#listeners.set(eventType, { type: eventType, callback: callback, payload: payload });
    }
  }

  emit(eventType, ...args) {
    for (const event of this.#listeners.values()) {
      event.callback(...args, event.payload);
    }
  }

  listener(eventType, callback) {
    this.on(eventType, callback);
  }

  get listeners() {
    return this.#listeners.values();
  }
}
This high-precision version captures the core functionality and removes unnecessary complexity and speculation.