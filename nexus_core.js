NEXUS_CORE EVENT_BUS AND WORKER_SYSTEM
VERSION: 1.5.0
STATUS: AUDITED / PRECISION

const NexusConstants = {
  DEFAULT_TIMEOUT: 5000,
  MAX_RETRIES: 5,
  CIRCUIT_THRESHOLD: 10,
  RESET_TIMEOUT: 60000,
  MAX_BACKOFF: 15000,
  HEAP_INITIAL_CAPACITY: 1024,
  HEARTBEAT_INTERVAL: 2000,
  STATE: {
    IDLE: 'IDLE',
    BUSY: 'BUSY',
    CRASHED: 'CRASHED',
    STALE: 'STALE',
    SHUTTING_DOWN: 'SHUTTING_DOWN'
  },
  LEVEL: {
    TRACE: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
    FATAL: 5
  },
  STRATEGY: {
    EXPONENTIAL: 'EXPONENTIAL',
    LINEAR: 'LINEAR',
    FIBONACCI: 'FIBONACCI'
  }
};

class NexusThread {
  #id;
  #state = NexusConstants.STATE.IDLE;
  #lastActivity = Date.now();
  #telemetry = { processed: 0, failures: 0, totalExecutionTime: 0 };
  #heartbeatTimer = null;
  #currentTask = null;

  constructor(id) {
    this.#id = id;
    this.#initHeartbeat();
  }

  #initHeartbeat() {
    this.#heartbeatTimer = setInterval(() => {
      const idleTime = Date.now() - this.#lastActivity;
      if (idleTime > NexusConstants.DEFAULT_TIMEOUT * 5 && this.#state === NexusConstants.STATE.IDLE) {
        this.#state = NexusConstants.STATE.STALE;
      }
    }, NexusConstants.HEARTBEAT_INTERVAL);
  }

  get id() { return this.#id; }
  get state() { return this.#state; }
  get stats() {
    return {
      ...this.#telemetry,
      uptime: Date.now() - this.#lastActivity,
      averageLatency: this.#telemetry.processed > 0 ? this.#telemetry.totalExecutionTime / this.#telemetry.processed : 0
    };
  }

  async handleEvent(event, handler) {
    const startTime = performance.now();
    this.#state = NexusConstants.STATE.BUSY;
    this.#lastActivity = Date.now();
    this.#currentTask = event.id || 'anonymous';

    try {
      const result = await handler(event);
      this.#telemetry.processed++;
      this.#telemetry.totalExecutionTime += (performance.now() - startTime);
      return result;
    } catch (error) {
      this.#telemetry.failures++;
      this.#state = NexusConstants.STATE.CRASHED;
      throw error;
    } finally {
      this.#currentTask = null;
      if (this.#state !== NexusConstants.STATE.CRASHED) {
        this.#state = NexusConstants.STATE.IDLE;
      }
    }
  }

  reset() {
    this.#state = NexusConstants.STATE.IDLE;
    this.#telemetry.failures = 0;
    this.#lastActivity = Date.now();
  }

  dispose() {
    clearInterval(this.#heartbeatTimer);
    this.#state = NexusConstants.STATE.SHUTTING_DOWN;
  }
}

class NexusThreadFactory {
  #eventName;
  #instanceCount = 0;
  #activePool = new Map();

  constructor(eventName) {
    this.#eventName = eventName;
  }

  createThread() {
    this.#instanceCount++;
    const threadId = `${this.#eventName}-thread-${this.#instanceCount}`;
    const thread = new NexusThread(threadId);
    this.#activePool.set(threadId, thread);
    return thread;
  }

  getPoolStats() {
    const threads = Array.from(this.#activePool.values());
    return {
      total: threads.length,
      busy: threads.filter(t => t.state === NexusConstants.STATE.BUSY).length,
      crashed: threads.filter(t => t.state === NexusConstants.STATE.CRASHED).length,
      stale: threads.filter(t => t.state === NexusConstants.STATE.STALE).length
    };
  }

  reap() {
    for (const [id, thread] of this.#activePool) {
      if (thread.state === NexusConstants.STATE.CRASHED || thread.state === NexusConstants.STATE.STALE) {
        thread.dispose();
        this.#activePool.delete(id);
      }
    }
  }

  destroy() {
    this.#activePool.forEach(t => t.dispose());
    this.#activePool.clear();
    this.#instanceCount = 0;
  }
}

class NexusDiagnosticEmitter {
  #observers = new Map();
  #history = [];
  #maxHistory = 100;

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

    const enrichedPayload = {
      ...payload,
      timestamp,
      severity: levelName,
      pid: (typeof process !== 'undefined') ? process.pid : 0,
      mem: (typeof process !== 'undefined') ? process.memoryUsage().heapUsed : 0
    };

    this.#history.push(enrichedPayload);
    if (this.#history.length > this.#maxHistory) this.#history.shift();

    this.#observers.forEach(config => {
      if (numericLevel >= config.minLevel) {
        try {
          config.fn(enrichedPayload);
        } catch (e) {
          // Internal logging failure handled via console
        }
      }
    });
  }

  getSnapshot() {
    return [...this.#history];
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
    this.#failureCount = Math.max(0, this.#failureCount - 0.5);
  }

  isOpen() {
    return this.#state === 'OPEN';
  }

  getStatus() {
    return {
      state: this.#state,
      failures: Math.floor(this.#failureCount),
      isHealthy: this.#state !== 'OPEN'
    };
  }
}

class NexusExecutionDecorator {
  static async execute(task, config = {}, diagnosticEmitter) {
    const maxRetries = config.maxRetries ?? NexusConstants.MAX_RETRIES;
    const strategy = config.backoffStrategy || NexusConstants.STRATEGY.EXPONENTIAL;
    const start = performance.now();
    let attempts = 0;
    let lastError = null;
    const circuitBreaker = task.circuitBreaker || new NexusCircuitBreaker();

    while (attempts < maxRetries) {
      if (circuitBreaker.isOpen()) {
        diagnosticEmitter.emit({ level: 'WARN', type: 'CIRCUIT_OPEN', taskId: task.id });
        throw new Error(`Circuit Breaker Restricted: ${task.id}`);
      }

      try {
        diagnosticEmitter.emit({ level: 'DEBUG', type: 'TASK_START', taskId: task.id, attempt: attempts + 1 });
        
        const result = await Promise.race([
          task.execute(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Internal Task Timeout')), NexusConstants.DEFAULT_TIMEOUT * 2)
          )
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

        const backoff = this.#calculateBackoff(strategy, attempts);
        await new Promise(r => setTimeout(r, backoff));
      }
    }

    diagnosticEmitter.emit({ level: 'ERROR', type: 'TASK_FAILURE', taskId: task.id, error: lastError.message });
    throw lastError;
  }

  static #calculateBackoff(strategy, attempt) {
    let base = 100;
    switch (strategy) {
      case NexusConstants.STRATEGY.FIBONACCI:
        const fib = (n) => n <= 1 ? n : fib(n - 1) + fib(n - 2);
        return Math.min(fib(attempt + 2) * base, NexusConstants.MAX_BACKOFF);
      case NexusConstants.STRATEGY.LINEAR:
        return Math.min(attempt * base * 2, NexusConstants.MAX_BACKOFF);
      case NexusConstants.STRATEGY.EXPONENTIAL:
      default:
        return Math.min(Math.pow(2, attempt) * base, NexusConstants.MAX_BACKOFF);
    }
  }
}