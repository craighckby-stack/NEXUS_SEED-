import { performance } from 'perf_hooks';

const Lane = Object.freeze({
  NoLanes:               0b0000000000000000000000000000000,
  SyncLane:              0b0000000000000000000000000000001,
  InputContinuousLane:   0b0000000000000000000000000000010,
  DefaultLane:           0b0000000000000000000000000000100,
  TransitionLanes:       0b0000000011111111111111111111000,
  RetryLanes:            0b0000011110000000000000000000000,
  IdleLane:              0b0100000000000000000000000000000,
  OffscreenLane:         0b1000000000000000000000000000000,
});

const WorkPriority = Object.freeze({
  ImmediatePriority: 1,
  UserBlockingPriority: 2,
  NormalPriority: 3,
  LowPriority: 4,
  IdlePriority: 5,
});

const FiberTag = Object.freeze({
  FunctionComponent: 0,
  ClassComponent: 1,
  HostRoot: 3,
  HostComponent: 5,
  HostText: 6,
  Fragment: 7,
});

const FiberFlags = Object.freeze({
  NoFlags:         0b00000000000000000000000000,
  Placement:       0b00000000000000000000000010,
  Update:          0b00000000000000000000000100,
  Deletion:        0b00000000000000000000001000,
  ContentReset:    0b00000000000000000000010000,
  Callback:        0b00000000000000000000100000,
  Ref:             0b00000000000000000001000000,
  Snapshot:        0b00000000000000000010000000,
  Passive:         0b00000000000000000100000000,
});

const DiagnosticCategory = { Error: 1, Message: 3, Telemetry: 4 };

const DiagnosticMessages = {
  PHASE_ENTER: { code: 1000, category: DiagnosticCategory.Message, message: "Entering phase: {0}" },
  WORK_LOOP_START: { code: 1002, category: DiagnosticCategory.Message, message: "Fiber work-loop iteration started on Lane {0}" },
  SCHEDULER_YIELD: { code: 7001, category: DiagnosticCategory.Telemetry, message: "Scheduler yielding control. Time remaining: {0}ms" },
  RECONCILIATION_ERROR: { code: 9001, category: DiagnosticCategory.Error, message: "Fiber reconciliation failed at Node {0}: {1}" },
};

class PriorityQueue {
  #heap = [];

  push(node) {
    const index = this.#heap.length;
    this.#heap.push(node);
    this.#siftUp(node, index);
  }

  peek() {
    return this.#heap.length === 0 ? null : this.#heap[0];
  }

  pop() {
    if (this.#heap.length === 0) return null;
    const first = this.#heap[0];
    const last = this.#heap.pop();
    if (last !== first) {
      this.#heap[0] = last;
      this.#siftDown(last, 0);
    }
    return first;
  }

  #siftUp(node, i) {
    let index = i;
    while (index > 0) {
      let parentIndex = (index - 1) >> 1;
      let parent = this.#heap[parentIndex];
      if (this.#compare(node, parent) < 0) {
        this.#heap[parentIndex] = node;
        this.#heap[index] = parent;
        index = parentIndex;
      } else return;
    }
  }

  #siftDown(node, i) {
    let index = i;
    const length = this.#heap.length;
    const halfLength = length >> 1;
    while (index < halfLength) {
      let leftIndex = (index + 1) * 2 - 1;
      let rightIndex = leftIndex + 1;
      let left = this.#heap[leftIndex];
      let right = this.#heap[rightIndex];

      if (this.#compare(left, node) < 0) {
        if (right !== undefined && this.#compare(right, left) < 0) {
          this.#heap[index] = right;
          this.#heap[rightIndex] = node;
          index = rightIndex;
        } else {
          this.#heap[index] = left;
          this.#heap[leftIndex] = node;
          index = leftIndex;
        }
      } else if (right !== undefined && this.#compare(right, node) < 0) {
        this.#heap[index] = right;
        this.#heap[rightIndex] = node;
        index = rightIndex;
      } else return;
    }
  }

  #compare(a, b) {
    const diff = a.expirationTime - b.expirationTime;
    return diff !== 0 ? diff : a.id - b.id;
  }

  get length() { return this.#heap.length; }
}

class DiagnosticHub {
  constructor() {
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  report(descriptor, ...args) {
    const message = descriptor.message.replace(/\{(\d+)\}/g, (match, index) => 
      args[index] !== undefined ? args[index] : match
    );
    const payload = { ...descriptor, message, timestamp: performance.now() };
    this.listeners.forEach(fn => fn(payload));
  }
}

const GlobalDiagnostics = new DiagnosticHub();

class LaneManager {
  static getHighestPriorityLane(lanes) { return lanes & -lanes; }
  static isHigherPriority(laneA, laneB) { return laneA !== 0 && (laneA < laneB || laneB === 0); }
  static mergeLanes(a, b) { return a | b; }
  static removeLanes(set, subset) { return set & ~subset; }
  static includesSomeLane(set, subset) { return (set & subset) !== 0; }
}

class NexusUpdateQueue {
  constructor() {
    this.baseState = null;
    this.firstBaseUpdate = null;
    this.lastBaseUpdate = null;
    this.shared = { pending: null };
  }

  enqueueUpdate(fiber, update) {
    const pending = this.shared.pending;
    if (pending === null) {
      update.next = update;
    } else {
      update.next = pending.next;
      pending.next = update;
    }
    this.shared.pending = update;
  }

  static createUpdate(lane) {
    return { lane, payload: null, next: null };
  }
}

class NexusFiber {
  constructor(tag, pendingProps, key, mode) {
    this.tag = tag;
    this.key = key;
    this.type = null;
    this.stateNode = null;
    this.return = null;
    this.child = null;
    this.sibling = null;
    this.index = 0;
    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.updateQueue = null;
    this.memoizedState = null;
    this.mode = mode;
    this.flags = FiberFlags.NoFlags;
    this.subtreeFlags = FiberFlags.NoFlags;
    this.lanes = Lane.NoLanes;
    this.childLanes = Lane.NoLanes;
    this.alternate = null;
  }
}

class NexusScheduler {
  constructor() {
    this.taskQueue = new PriorityQueue();
    this.isHostCallbackScheduled = false;
    this.isPerformingWork = false;
    this.deadline = 0;
    this.yieldInterval = 5;
  }

  shouldYield() {
    return performance.now() >= this.deadline;
  }

  scheduleCallback(priorityLevel, callback) {
    const startTime = performance.now();
    let timeout;
    switch (priorityLevel) {
      case WorkPriority.ImmediatePriority: timeout = -1; break;
      case WorkPriority.UserBlockingPriority: timeout = 250; break;
      case WorkPriority.IdlePriority: timeout = 1073741823; break;
      case WorkPriority.LowPriority: timeout = 10000; break;
      default: timeout = 5000; break;
    }

    const expirationTime = startTime + timeout;
    const newTask = {
      id: Math.random(),
      callback,
      priorityLevel,
      startTime,
      expirationTime,
    };

    this.taskQueue.push(newTask);
    if (!this.isHostCallbackScheduled && !this.isPerformingWork) {
      this.isHostCallbackScheduled = true;
      this.#requestHostCallback();
    }
    return newTask;
  }

  #requestHostCallback() {
    setImmediate(() => this.#workLoop());
  }

  #workLoop() {
    this.isPerformingWork = true;
    this.deadline = performance.now() + this.yieldInterval;
    try {
      let currentTask = this.taskQueue.peek();
      while (currentTask !== null) {
        if (currentTask.expirationTime > performance.now() && this.shouldYield()) {
          break;
        }
        const callback = currentTask.callback;
        if (typeof callback === 'function') {
          currentTask.callback = null;
          const didUserCallbackTimeout = currentTask.expirationTime <= performance.now();
          const continuationCallback = callback(didUserCallbackTimeout);
          if (typeof continuationCallback === 'function') {
            currentTask.callback = continuationCallback;
          } else {
            if (currentTask === this.taskQueue.peek()) {
              this.taskQueue.pop();
            }
          }
        } else {
          this.taskQueue.pop();
        }
        currentTask = this.taskQueue.peek();
      }
    } finally {
      this.isPerformingWork = false;
      if (this.taskQueue.peek() !== null) {
        this.#requestHostCallback();
      } else {
        this.isHostCallbackScheduled = false;
      }
    }
  }
}