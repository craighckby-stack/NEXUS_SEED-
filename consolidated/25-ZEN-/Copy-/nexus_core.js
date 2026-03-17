import { performance } from 'perf_hooks';

const Lane = {
  NoLanes:             0b0000000000000000000000000000000,
  SyncLane:            0b0000000000000000000000000000001,
  InputContinuousLane: 0b0000000000000000000000000000010,
  DefaultLane:         0b0000000000000000000000000000100,
  TransitionLanes:     0b0000000011111111111111111111000,
  IdleLane:            0b0100000000000000000000000000000,
};

const WorkPriority = {
  ImmediatePriority: 1,
  UserBlockingPriority: 2,
  NormalPriority: 3,
  LowPriority: 4,
  IdlePriority: 5,
};

const FiberFlags = {
  NoFlags:   0b0000000000000000,
  Placement: 0b0000000000000010,
  Update:    0b0000000000000100,
  Deletion:  0b0000000000001000,
};

const DiagnosticCategory = {
  Warning: 0,
  Error: 1,
  Suggestion: 2,
  Message: 3,
  Telemetry: 4,
};

const DiagnosticMessages = {
  PHASE_ENTER: { code: 1000, category: DiagnosticCategory.Message, message: "Entering phase: {0}" },
  PHASE_TRANSITION_ERROR: { code: 4001, category: DiagnosticCategory.Error, message: "Phase transition error from {0} to {1}: {2}" },
  METRIC_SUMMARY: { code: 6001, category: DiagnosticCategory.Suggestion, message: "Unit '{0}' processed in {1}ms." },
  SCHEDULER_YIELD: { code: 7001, category: DiagnosticCategory.Telemetry, message: "Scheduler yielding control. Execution time: {0}ms" },
  POOL_EXHAUSTED: { code: 8001, category: DiagnosticCategory.Warning, message: "Object pool '{0}' exhausted. Allocating new instance." },
};

class DiagnosticEmitter {
  #listeners = new Set();

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  emit(diagnostic, ...args) {
    const payload = {
      ...diagnostic,
      timestamp: performance.now(),
      args
    };
    this.#listeners.forEach(listener => {
      try {
        listener(payload);
      } catch (e) {}
    });
  }
}

class LaneManager {
  static getHighestPriorityLane(lanes) {
    return lanes & -lanes;
  }

  static includesLane(set, subset) {
    return (set & subset) !== Lane.NoLanes;
  }

  static mergeLanes(a, b) {
    return a | b;
  }

  static removeLanes(set, subset) {
    return set & ~subset;
  }

  static isSyncLane(lanes) {
    return (lanes & Lane.SyncLane) !== Lane.NoLanes;
  }
}

class NexusObjectPool {
  #pool = [];
  #limit;
  #ctor;
  #name;
  #diagnostics;

  constructor(ctor, name, diagnostics, limit = 1000) {
    this.#ctor = ctor;
    this.#name = name;
    this.#diagnostics = diagnostics;
    this.#limit = limit;
  }

  acquire(...args) {
    if (this.#pool.length > 0) {
      const instance = this.#pool.pop();
      if (typeof instance.initialize === 'function') {
        instance.initialize(...args);
      } else {
        this.#ctor.apply(instance, args);
      }
      return instance;
    }
    this.#diagnostics.emit(DiagnosticMessages.POOL_EXHAUSTED, this.#name);
    return new this.#ctor(...args);
  }

  release(instance) {
    if (this.#pool.length < this.#limit) {
      if (typeof instance.cleanup === 'function') instance.cleanup();
      this.#pool.push(instance);
    }
  }
}

class MinHeap {
  #heap = [];

  push(node) {
    this.#heap.push(node);
    this.#siftUp(this.#heap.length - 1);
  }

  peek() {
    return this.#heap[0] || null;
  }

  pop() {
    if (this.#heap.length === 0) return null;
    const first = this.#heap[0];
    const last = this.#heap.pop();
    if (this.#heap.length > 0) {
      this.#heap[0] = last;
      this.#siftDown(0);
    }
    return first;
  }

  get length() { return this.#heap.length; }

  #siftUp(index) {
    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      if (this.#compare(this.#heap[index], this.#heap[parentIndex]) < 0) {
        this.#swap(index, parentIndex);
        index = parentIndex;
      } else break;
    }
  }

  #siftDown(index) {
    const length = this.#heap.length;
    while (true) {
      let smallest = index;
      const left = (index << 1) + 1;
      const right = (index << 1) + 2;
      if (left < length && this.#compare(this.#heap[left], this.#heap[smallest]) < 0) smallest = left;
      if (right < length && this.#compare(this.#heap[right], this.#heap[smallest]) < 0) smallest = right;
      if (smallest !== index) {
        this.#swap(index, smallest);
        index = smallest;
      } else break;
    }
  }

  #swap(i, j) {
    const temp = this.#heap[i];
    this.#heap[i] = this.#heap[j];
    this.#heap[j] = temp;
  }

  #compare(a, b) {
    const diff = a.expirationTime - b.expirationTime;
    if (diff !== 0) return diff;
    return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
  }
}

function taskInterceptor(callback, host, task) {
  return (didTimeout) => {
    const start = performance.now();
    host.diagnostics.emit(DiagnosticMessages.PHASE_ENTER, `Task:${task.id}`);
    try {
      const result = callback(didTimeout);
      const duration = performance.now() - start;
      if (duration > 10) {
        host.diagnostics.emit(DiagnosticMessages.METRIC_SUMMARY, task.id, duration.toFixed(2));
      }
      return result;
    } catch (error) {
      throw error;
    }
  };
}