NEXUS_CORE EVENT_BUS AND WORKER_SYSTEM
VERSION: 1.4.0
STATUS: AUDITED / STRIPPED

const NexusConstants = {
  DEFAULT_TIMEOUT: 5000,
  MAX_RETRIES: 5,
  CIRCUIT_THRESHOLD: 10,
  RESET_TIMEOUT: 60000,
  MAX_BACKOFF: 15000,
  HEAP_INITIAL_CAPACITY: 1024,
  STATE: { IDLE: 'IDLE', BUSY: 'BUSY', CRASHED: 'CRASHED' },
  LEVEL: { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, FATAL: 5 }
};

class NexusThread {
  #id;
  #state = NexusConstants.STATE.IDLE;
  #lastActivity = Date.now();
  #telemetry = { processed: 0, failures: 0 };

  constructor(id) {
    this.#id = id;
  }

  get id() { return this.#id; }
  get state() { return this.#state; }
  get stats() { return { ...this.#telemetry, uptime: Date.now() - this.#lastActivity }; }

  async handleEvent(event, handler) {
    this.#state = NexusConstants.STATE.BUSY;
    this.#lastActivity = Date.now();
    try {
      const result = await handler(event);
      this.#telemetry.processed++;
      return result;
    } catch (error) {
      this.#telemetry.failures++;
      this.#state = NexusConstants.STATE.CRASHED;
      throw error;
    } finally {
      if (this.#state !== NexusConstants.STATE.CRASHED) {
        this.#state = NexusConstants.STATE.IDLE;
      }
    }
  }

  async waitForEvent(name, timeoutMs = NexusConstants.DEFAULT_TIMEOUT) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), timeoutMs);
      queueMicrotask(() => {
        clearTimeout(timer);
        resolve(true);
      });
    });
  }

  reset() {
    this.#state = NexusConstants.STATE.IDLE;
    this.#telemetry.failures = 0;
  }
}

class NexusThreadFactory {
  #eventName;
  #instanceCount = 0;
  #activePool = new Set();

  constructor(eventName) {
    this.#eventName = eventName;
  }

  createThread() {
    this.#instanceCount++;
    const thread = new NexusThread(`${this.#eventName}-thread-${this.#instanceCount}`);
    this.#activePool.add(thread);
    return thread;
  }

  getPoolStats() {
    return {
      size: this.#activePool.size,
      active: [...this.#activePool].filter(t => t.state === NexusConstants.STATE.BUSY).length
    };
  }

  recycle(thread) {
    if (thread.state === NexusConstants.STATE.CRASHED) {
      thread.reset();
    }
  }

  destroy() {
    this.#activePool.clear();
    this.#instanceCount = 0;
  }
}

class NexusDiagnosticEmitter {
  #observers = new Map();

  subscribe(fn, minLevel = 'INFO') {
    const id = Symbol('observer');
    const numericLevel = NexusConstants.LEVEL[minLevel] ?? 2;
    this.#observers.set(id, { fn, minLevel: numericLevel });
    return () => this.#observers.delete(id);
  }

  emit(payload) {
    const timestamp = new Date().toISOString();
    const levelName = payload.level || 'INFO';
    const numericLevel = NexusConstants.LEVEL[levelName] ?? 2;

    this.#observers.forEach(config => {
      if (numericLevel >= config.minLevel) {
        config.fn({
          ...payload,
          timestamp,
          severity: levelName,
          pid: (typeof process !== 'undefined') ? process.pid : 0
        });
      }
    });
  }
}

class NexusCircuitBreaker {
  #failureCount = 0;
  #threshold = NexusConstants.CIRCUIT_THRESHOLD;
  #state = 'CLOSED';
  #resetTimeout = NexusConstants.RESET_TIMEOUT;

  recordFailure() {
    this.#failureCount++;
    if (this.#failureCount >= this.#threshold) {
      this.#state = 'OPEN';
      setTimeout(() => {
        this.#state = 'HALF_OPEN';
      }, this.#resetTimeout);
    }
  }

  recordSuccess() {
    if (this.#state === 'HALF_OPEN') {
      this.#failureCount = 0;
      this.#state = 'CLOSED';
    }
    this.#failureCount = Math.max(0, this.#failureCount - 1);
  }

  isOpen() {
    return this.#state === 'OPEN';
  }

  getStatus() {
    return { state: this.#state, failures: this.#failureCount };
  }
}

class NexusExecutionDecorator {
  static async execute(task, config = {}, diagnosticEmitter) {
    const maxRetries = config.maxRetries ?? NexusConstants.MAX_RETRIES;
    const start = performance.now();
    let attempts = 0;
    let lastError = null;
    const circuitBreaker = task.circuitBreaker || new NexusCircuitBreaker();

    while (attempts < maxRetries) {
      if (circuitBreaker.isOpen()) {
        throw new Error(`Circuit Breaker Restricted: ${task.id}`);
      }

      try {
        diagnosticEmitter.emit({ level: 'DEBUG', type: 'TASK_START', taskId: task.id, attempt: attempts + 1 });
        
        const result = await Promise.race([
          task.execute(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Internal Task Timeout')), NexusConstants.DEFAULT_TIMEOUT * 2))
        ]);

        circuitBreaker.recordSuccess();
        diagnosticEmitter.emit({
          level: 'INFO', 
          type: 'TASK_SUCCESS', 
          taskId: task.id, 
          duration: performance.now() - start 
        });
        return result;
      } catch (error) {
        attempts++;
        lastError = error;
        circuitBreaker.recordFailure();

        diagnosticEmitter.emit({
          level: 'WARN', 
          type: 'TASK_RETRY', 
          taskId: task.id, 
          attempt: attempts, 
          error: error.message 
        });

        if (attempts >= maxRetries) break;

        const backoff = Math.min(NexusConstants.MAX_BACKOFF, Math.pow(2, attempts) * 100) + (Math.random() * 100);
        await new Promise(r => setTimeout(r, backoff));
      }
    }

    diagnosticEmitter.emit({ level: 'ERROR', type: 'TASK_FAILURE', taskId: task.id, error: lastError.message });
    throw lastError;
  }
}

class NexusTaskQueue {
  #heap = [];
  #capacity;

  constructor(capacity = NexusConstants.HEAP_INITIAL_CAPACITY) {
    this.#capacity = capacity;
  }

  async pushTask(task) {
    if (this.#heap.length >= this.#capacity) {
      throw new Error('Capacity Exhausted');
    }
    this.#heap.push(task);
    this.#bubbleUp(this.#heap.length - 1);
  }

  popTask() {
    if (this.size() === 0) return null;
    const top = this.#heap[0];
    const bottom = this.#heap.pop();
    if (this.size() > 0) {
      this.#heap[0] = bottom;
      this.#sinkDown(0);
    }
    return top;
  }

  #bubbleUp(index) {
    const element = this.#heap[index];
    while (index > 0) {
      let parentIdx = (index - 1) >> 1;
      let parent = this.#heap[parentIdx];
      if ((element.priority || 0) <= (parent.priority || 0)) break;
      this.#heap[index] = parent;
      index = parentIdx;
    }
    this.#heap[index] = element;
  }

  #sinkDown(index) {
    const length = this.#heap.length;
    const element = this.#heap[index];
    const priority = element.priority || 0;

    while (true) {
      let leftIdx = (index << 1) + 1;
      let rightIdx = (index << 1) + 2;
      let swap = null;

      if (leftIdx < length) {
        if ((this.#heap[leftIdx].priority || 0) > priority) {
          swap = leftIdx;
        }
      }

      if (rightIdx < length) {
        if (
          (swap === null && (this.#heap[rightIdx].priority || 0) > priority) ||
          (swap !== null && (this.#heap[rightIdx].priority || 0) > (this.#heap[leftIdx].priority || 0))
        ) {
          swap = rightIdx;
        }
      }

      if (swap === null) break;
      this.#heap[index] = this.#heap[swap];
      index = swap;
    }
    this.#heap[index] = element;
  }

  size() {
    return this.#heap.length;
  }
}

class NexusEventBus {
  #events = new Map();
  #customFilters = new Map();
  #threadPools = new Map();
  #middleware = [];
  #diagnosticEmitter;

  constructor(diagnosticEmitter) {
    this.#diagnosticEmitter = diagnosticEmitter || new NexusDiagnosticEmitter();
  }

  use(fn) {
    if (typeof fn !== 'function') throw new Error('Middleware must be a function');
    this.#middleware.push(fn);
  }

  async broadcast(event) {
    for (const hook of this.#middleware) {
      await hook(event);
    }

    if (this.#events.has(event.type)) {
      const listeners = this.#events.get(event.type);
      const threadsMap = this.#threadPools.get(event.type);
      
      const tasks = Array.from(listeners).map(async (listener) => {
        const filter = this.#customFilters.get(event.type);
        if (filter && !filter(event)) return;

        const thread = threadsMap.get(listener);
        if (!thread) throw new Error(`Orphaned listener: ${event.type}`);
        
        return thread.handleEvent(event, listener);
      });

      return await Promise.allSettled(tasks);
    }
  }

  async subscribe(eventName, listener, options = {}) {
    const { customFilter = null, poolSize = 3 } = options;
    if (!this.#events.has(eventName)) {
      this.#events.set(eventName, new Set());
    }
  }
}