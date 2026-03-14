import { performance } from 'perf_hooks';

const Lane = {
  NoLanes: 0b0000000000000000000000000000000,
  SyncLane: 0b0000000000000000000000000000001,
  InputContinuousLane: 0b0000000000000000000000000000010,
  DefaultLane: 0b0000000000000000000000000000100,
  TransitionLanes: 0b0000000011111111111111111111000,
  IdleLane: 0b0100000000000000000000000000000,
};

const WorkPriority = {
  ImmediatePriority: 1,
  UserBlockingPriority: 2,
  NormalPriority: 3,
  LowPriority: 4,
  IdlePriority: 5,
};

const FiberFlags = {
  NoFlags: 0b0000000000000000,
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
  BOOTSTRAP_START: { code: 1001, category: DiagnosticCategory.Message, message: "Bootstrap sequence initiated." },
  CONFIG_VALIDATION_FAILED: { code: 2001, category: DiagnosticCategory.Error, message: "Configuration audit failed: Missing property '{0}'" },
  PIPELINE_CANCELED: { code: 3001, category: DiagnosticCategory.Warning, message: "Pipeline execution preempted via CancellationToken." },
  PHASE_TRANSITION_ERROR: { code: 4001, category: DiagnosticCategory.Error, message: "Phase transition error from {0} to {1}: {2}" },
  SYSTEM_READY: { code: 5001, category: DiagnosticCategory.Message, message: "System ready. Version: {0}. Path: {1}" },
  METRIC_SUMMARY: { code: 6001, category: DiagnosticCategory.Suggestion, message: "Unit '{0}' processed in {1}ms." },
  SCHEDULER_YIELD: { code: 7001, category: DiagnosticCategory.Telemetry, message: "Scheduler yielding control. Execution time: {0}ms" },
  WORK_COMMIT: { code: 8001, category: DiagnosticCategory.Message, message: "Work root committed. Total units: {0}. Lanes: {1}" },
};

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

  static isSubsetOfLanes(set, subset) {
    return (set & subset) === subset;
  }
}

class NexusScheduler {
  #taskQueue = [];
  #isHostCallbackScheduled = false;
  #isPerformingWork = false;
  #yieldInterval = 5;
  #deadline = 0;

  constructor(host) {
    this.host = host;
  }

  scheduleCallback(priority, callback, options = {}) {
    const currentTime = performance.now();
    const timeout = this.#getTimeoutByPriority(priority);
    
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      callback,
      priority,
      startTime: currentTime,
      expirationTime: currentTime + timeout,
      lane: options.lane || Lane.DefaultLane,
    };

    this.#taskQueue.push(newTask);
    this.#sortTasks();

    if (!this.#isHostCallbackScheduled && !this.#isPerformingWork) {
      this.#isHostCallbackScheduled = true;
      this.#requestHostCallback();
    }

    return newTask;
  }

  #sortTasks() {
    this.#taskQueue.sort((a, b) => a.expirationTime - b.expirationTime);
  }

  #getTimeoutByPriority(priority) {
    switch (priority) {
      case WorkPriority.ImmediatePriority: return -1;
      case WorkPriority.UserBlockingPriority: return 250;
      case WorkPriority.NormalPriority: return 5000;
      case WorkPriority.LowPriority: return 10000;
      case WorkPriority.IdlePriority: return 1073741823;
      default: return 5000;
    }
  }

  #requestHostCallback() {
    if (typeof setImmediate !== 'undefined') {
      setImmediate(() => this.#workLoop());
    } else {
      setTimeout(() => this.#workLoop(), 0);
    }
  }

  shouldYield() {
    return performance.now() >= this.#deadline;
  }

  #workLoop() {
    this.#isPerformingWork = true;
    this.#isHostCallbackScheduled = false;
    this.#deadline = performance.now() + this.#yieldInterval;

    try {
      while (this.#taskQueue.length > 0) {
        if (this.shouldYield()) {
          this.host.reportDiagnostic(
            DiagnosticMessages.SCHEDULER_YIELD, 
            Math.round(performance.now() - (this.#deadline - this.#yieldInterval))
          );
          break;
        }

        const currentTask = this.#taskQueue[0];
        const didUserCallbackTimeout = currentTask.expirationTime <= performance.now();
        const continuation = currentTask.callback(didUserCallbackTimeout);

        if (typeof continuation === 'function') {
          currentTask.callback = continuation;
        } else {
          if (this.#taskQueue[0] === currentTask) {
            this.#taskQueue.shift();
          }
        }
        this.#sortTasks();
      }

      if (this.#taskQueue.length > 0) {
        this.#isHostCallbackScheduled = true;
        this.#requestHostCallback();
      }
    } finally {
      this.#isPerformingWork = false;
    }
  }
}

class NexusFiber {
  constructor(name, action, priority, lane = Lane.DefaultLane) {
    this.name = name;
    this.action = action;
    this.priority = priority;
    this.lanes = lane;
    this.return = null;
    this.child = null;
    this.sibling = null;
    this.alternate = null;
    this.flags = FiberFlags.NoFlags;
  }
}