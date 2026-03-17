// ============================================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================================

const config = {
  maxRetries: 5,
  backoffMultiplier: 2,
  initialBackoffMs: 100,
  rateLimitStatusCode: 429,
  batchSize: 100,
  maxBackoffMs: 5000,
  apiEndpoint: '[https://api.sovereign.com/v1/batch](https://api.sovereign.com/v1/batch)',
};

const actionTypes = {
  ENQUEUE_ITEMS: 'ENQUEUE_ITEMS',
  START_PROCESSING: 'START_PROCESSING',
  FINISH_PROCESSING: 'FINISH_PROCESSING',
  INCREMENT_SUCCESS: 'INCREMENT_SUCCESS',
  INCREMENT_FAILURE: 'INCREMENT_FAILURE',
  CLEAR_PROCESSED_QUEUE: 'CLEAR_PROCESSED_QUEUE',
};

// ============================================================================
// 2. STATE MANAGEMENT (Reducer and Core State)
// ============================================================================

const initialState = {
  queue: [],
  processedCount: 0,
  failedCount: 0,
  isProcessing: false,
};

function batchReducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.ENQUEUE_ITEMS:
      return { ...state, queue: [...state.queue, ...action.payload] };

    case actionTypes.CLEAR_PROCESSED_QUEUE:
      return { ...state, queue: state.queue.filter((item) => !item.processed) };

    case actionTypes.START_PROCESSING:
      return { ...state, isProcessing: true };

    case actionTypes.FINISH_PROCESSING:
      return { ...state, isProcessing: false };

    case actionTypes.INCREMENT_SUCCESS:
      return { ...state, processedCount: state.processedCount + action.payload };

    case actionTypes.INCREMENT_FAILURE:
      return { ...state, failedCount: state.failedCount + action.payload };

    default:
      return state;
  }
}

// ============================================================================
// 3. CORE PROCESSING LOGIC
// ============================================================================

function calculateBackoffDelay(retryCount) {
  const baseDelay = config.initialBackoffMs * Math.pow(config.backoffMultiplier, retryCount);
  return Math.min(baseDelay, config.maxBackoffMs);
}

async function flushBatch(state, dispatch, apiService) {
  if (state.isProcessing || state.queue.length === 0) return;

  dispatch({ type: actionTypes.START_PROCESSING });

  let workingQueueItems = state.queue.filter((item) => !item.processed);
  let totalSuccessfulItems = 0;
  let totalFailedItems = 0;

  const processChunk = async (batch) => {
    let retryCount = 0;
    let chunkHandled = false;

    while (!chunkHandled && retryCount < config.maxRetries) {
      try {
        // Replace with actual API call: await apiService.sendBatch(batch)
        const response = await apiService.sendBatch(batch);
        totalSuccessfulItems += batch.length;
        chunkHandled = true;
      } catch (error) {
        if (error.statusCode === config.rateLimitStatusCode && retryCount < config.maxRetries - 1) {
          const delay = calculateBackoffDelay(retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
        } else {
          totalFailedItems += batch.length;
          chunkHandled = true;
        }
      }
    }
  };

  while (workingQueueItems.length > 0) {
    const batchData = workingQueueItems.slice(0, config.batchSize);
    await processChunk(batchData);
    workingQueueItems = workingQueueItems.slice(config.batchSize);
  }

  if (totalSuccessfulItems > 0) {
    dispatch({ type: actionTypes.INCREMENT_SUCCESS, payload: totalSuccessfulItems });
  }

  if (totalFailedItems > 0) {
    dispatch({ type: actionTypes.INCREMENT_FAILURE, payload: totalFailedItems });
  }

  dispatch({ type: actionTypes.CLEAR_PROCESSED_QUEUE });
  dispatch({ type: actionTypes.FINISH_PROCESSING });
}
// ============================================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================================

const config = {
  maxRetries: 5,
  backoffMultiplier: 2,
  initialBackoffMs: 100,
  rateLimitStatusCode: 429,
  batchSize: 100,
  maxBackoffMs: 5000,
  apiEndpoint: 'https://api.sovereign.com/v1/batch',
};

const actionTypes = {
  ENQUEUE_ITEMS: 'ENQUEUE_ITEMS',
  START_PROCESSING: 'START_PROCESSING',
  FINISH_PROCESSING: 'FINISH_PROCESSING',
  INCREMENT_SUCCESS: 'INCREMENT_SUCCESS',
  INCREMENT_FAILURE: 'INCREMENT_FAILURE',
  CLEAR_PROCESSED_QUEUE: 'CLEAR_PROCESSED_QUEUE',
};

// ============================================================================
// 2. ERROR HANDLING
// ============================================================================

class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

class LoggingError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'LoggingError';
    this.statusCode = statusCode;
    this.details = details;
    this.reportError();
  }

  async reportError() {
    try {
      // Implement error reporting in production
      // For now, just logging the error
      console.error(this.message);
    } catch (error) {
      console.error('Error reporting failed:', error);
    }
  }
}

// ============================================================================
// 3. MOCK SERVICE ABSTRACTION
// ============================================================================

class ApiService {
  async sendBatch(batch) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 40));

    if (Math.random() < 0.3) {
      const isRateLimited = Math.random() < 0.1;
      const statusCode = isRateLimited ? config.rateLimitStatusCode : 503;

      throw new ApiError(
        `API request failed with status ${statusCode}`,
        statusCode,
        { endpoint: config.apiEndpoint, batchSize: batch.length },
      );
    }

    return { success: true, processedCount: batch.length };
  }
}

// ============================================================================
// 4. STATE MANAGEMENT (Reducer and Core State)
// ============================================================================

const initialState = {
  queue: [],
  processedCount: 0,
  failedCount: 0,
  isProcessing: false,
};

function batchReducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.ENQUEUE_ITEMS:
      return { ...state, queue: [...state.queue, ...action.payload] };

    case actionTypes.CLEAR_PROCESSED_QUEUE:
      return { ...state, queue: state.queue.filter((item) => !item.processed) };

    case actionTypes.START_PROCESSING:
      return { ...state, isProcessing: true };

    case actionTypes.FINISH_PROCESSING:
      return { ...state, isProcessing: false };

    case actionTypes.INCREMENT_SUCCESS:
      return { ...state, processedCount: state.processedCount + action.payload };

    case actionTypes.INCREMENT_FAILURE:
      return { ...state, failedCount: state.failedCount + action.payload };

    default:
      return state;
  }
}

// ============================================================================
// 5. CORE PROCESSING LOGIC
// ============================================================================

function calculateBackoffDelay(retryCount) {
  const baseDelay = config.initialBackoffMs * Math.pow(config.backoffMultiplier, retryCount);
  return Math.min(baseDelay, config.maxBackoffMs);
}

async function flushBatch(state, dispatch) {
  if (state.isProcessing || state.queue.length === 0) return;

  dispatch({ type: actionTypes.START_PROCESSING });

  let workingQueueItems = state.queue.filter((item) => !item.processed);
  let totalSuccessfulItems = 0;
  let totalFailedItems = 0;

  const processChunk = async (batch) => {
    let retryCount = 0;
    let chunkHandled = false;

    while (!chunkHandled && retryCount < config.maxRetries) {
      try {
        const response = await ApiService.sendBatch(batch);
        totalSuccessfulItems += batch.length;
        workingQueueItems = workingQueueItems.filter((item) => !item.processed);
        chunkHandled = true;
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === config.rateLimitStatusCode && retryCount < config.maxRetries - 1) {
          const delay = calculateBackoffDelay(retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
        } else {
          const reason = error instanceof ApiError ? `Max retries reached` : `Permanent Error (${error.statusCode || 'Unknown'})`;
          console.error(`[FAILURE] Chunk failed (${reason}). Size: ${batch.length}.`);
          totalFailedItems += batch.length;
          workingQueueItems = workingQueueItems.filter((item) => !item.processed);
          chunkHandled = true;
        }
      }
    }
  };

  while (workingQueueItems.length > 0) {
    const batchData = workingQueueItems.slice(0, config.batchSize);
    await processChunk(batchData);
  }

  if (totalSuccessfulItems > 0) {
    dispatch({ type: actionTypes.INCREMENT_SUCCESS, payload: totalSuccessfulItems });
  }

  if (totalFailedItems > 0) {
    dispatch({ type: actionTypes.INCREMENT_FAILURE, payload: totalFailedItems });
  }

  if (state.queue.length === 0) {
    dispatch({ type: actionTypes.CLEAR_PROCESSED_QUEUE });
  }

  dispatch({ type: actionTypes.FINISH_PROCESSING });
  console.log(`[FLUSH COMPLETE] Processed: Success=${totalSuccessfulItems}, Failed=${totalFailedItems}. Remaining buffer: ${workingQueueItems.length}`);
}

// ============================================================================
// 6. APPLICATION RUNNER & SUBSCRIPTIONS (Store Implementation)
// ============================================================================

class Store {
  constructor() {
    this.state = { ...initialState };
    this.listeners = [];
    this.dispatch = (action) => {
      const newState = batchReducer(this.state, action);
      if (newState !== this.state) {
        const oldState = this.state;
        this.state = newState;
        this.listeners.forEach((listener) => listener(this.state, oldState));
      }
    };
    this.subscribe = (listener) => {
      this.listeners.push(listener);
      return () => {
        const index = this.listeners.indexOf(listener);
        if (index > -1) this.listeners.splice(index, 1);
      };
    };
    this.getState = () => {
      return this.state;
    };
    this.subscribe((newState) => {
      if (newState.queue.length > 0 && !newState.isProcessing) {
        flushBatch(newState, this.dispatch);
      }
    });
  }
}

// ============================================================================
// 7. EXECUTION SIMULATION
// ============================================================================

const store = new Store();

console.log("--- Initializing Sovereign Batch Processor ---");

store.subscribe((state) => {
  if (!state.isProcessing && state.queue.length === 0) {
    console.log(`[SYSTEM STATUS] Idle. Total Processed: ${state.processedCount}, Total Failed: ${state.failedCount}`);
  }
});

const initialItemCount = 350;
const initialData = Array.from({ length: initialItemCount }, (_, i) => ({ id: `data-${i + 1}`, content: Math.random(), processed: false }));

console.log(`Seeding ${initialItemCount} items into the queue.`);
store.dispatch({ type: actionTypes.ENQUEUE_ITEMS, payload: initialData });

setTimeout(() => {
  const lateItemCount = 50;
  const lateData = Array.from({ length: lateItemCount }, (_, i) => ({ id: `late-data-${i + 1}`, content: Math.random(), processed: false }));
  console.log(`\n>>> Adding ${lateItemCount} more items after 2 seconds...`);
  store.dispatch({ type: actionTypes.ENQUEUE_ITEMS, payload: lateData });
}, 2000);

setTimeout(() => {
  const finalState = store.getState();
  if (finalState.queue.length > 0 || finalState.isProcessing) {
    console.log(`\n[SHUTDOWN WAIT] Waiting for final ${finalState.queue.length} items to clear...`);
    return setTimeout(() => console.log("\n--- Simulation Ended ---"), 4000);
  }
  console.log("\n--- Simulation Ended (Gracefully Idle) ---");
}, 15000);
```

**
