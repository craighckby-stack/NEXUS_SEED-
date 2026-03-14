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
}