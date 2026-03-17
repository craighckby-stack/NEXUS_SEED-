/**
 * Interface for any raw telemetry event or aggregated result that acts as an input
 * for a higher-level aggregation step (enabling recursive abstraction).
 */
export interface ITelemetryEvent {
    timestamp: number;
    // Typically includes fields like source, type, or duration metrics
}

/**
 * Interface for the resulting aggregated data structure.
 */
export interface IAggregationResult {
    startTime: number;
    endTime: number;
    count: number;
    // Specific metrics like 'sum', 'average', or 'p99' are defined by concrete strategies.
}

/**
 * Strategic interface for telemetry aggregation kernels.
 */
export interface ITelemetryAggregationStrategyKernel<TEvent extends ITelemetryEvent, TAggregate extends IAggregationResult> {
    /**
     * Standard asynchronous kernel initialization hook.
     */
    initialize(): Promise<void>;

    /**
     * Core asynchronous aggregation method. Implements the efficient single-pass reduce pattern.
     *
     * @param events The array of raw telemetry events or existing lower-level aggregates.
     * @param initialAggregate Optional starting aggregate structure for incremental updates.
     * @returns The finalized, computationally reduced aggregate structure wrapped in a Promise.
     */
    aggregate(events: TEvent[], initialAggregate?: TAggregate): Promise<TAggregate>;
}

/**
 * Abstract base class defining the contract for telemetry aggregation.
 * All aggregation steps are transitioned to asynchronous to handle potential I/O or heavy computation.
 *
 * This design promotes computational efficiency by enforcing the reducer pattern
 * (single pass over the data) and enables recursive abstraction by defining
 * distinct initialize, accumulation, and finalization steps.
 *
 * @template TEvent The type of the raw telemetry event or a lower-level aggregate.
 * @template TAggregate The type of the resulting aggregate data structure.
 */
export abstract class TelemetryAggregationStrategyKernel<TEvent extends ITelemetryEvent, TAggregate extends IAggregationResult> implements ITelemetryAggregationStrategyKernel<TEvent, TAggregate> {

    // Constructor intentionally omitted in the abstract base class but enforced in concrete implementations

    /**
     * Standard kernel initialization.
     */
    public abstract initialize(): Promise<void>;

    /**
     * Initializes the aggregate structure for a new aggregation period or group.
     * @param event The first event in the group (optional hint).
     */
    protected abstract initializeAggregate(event?: TEvent): Promise<TAggregate>;

    /**
     * Asynchronously accumulates a single event (or lower-level aggregate) into the current structure.
     * Must be computationally efficient (ideally O(1)).
     * @param aggregate The current aggregate structure.
     * @param event The new event to incorporate.
     */
    protected abstract accumulate(aggregate: TAggregate, event: TEvent): Promise<TAggregate>;

    /**
     * Asynchronously finalizes the aggregate structure, calculating averages, rates, or normalizing fields.
     * This step is crucial for preparing the resulting TAggregate to potentially become
     * the TEvent input for the next higher-level strategy (recursive abstraction).
     * @param aggregate The completed aggregate structure.
     */
    protected abstract finalize(aggregate: TAggregate): Promise<TAggregate>;

    /**
     * Core asynchronous aggregation method. Implements the efficient single-pass reduce pattern.
     *
     * @param events The array of raw telemetry events or existing lower-level aggregates.
     * @param initialAggregate Optional starting aggregate structure for incremental updates.
     * @returns A Promise resolving to the finalized, computationally reduced aggregate structure.
     */
    public async aggregate(events: TEvent[], initialAggregate?: TAggregate): Promise<TAggregate> {
        // Handle empty input arrays gracefully
        if (!events || events.length === 0) {
            const aggregateToFinalize = initialAggregate ?? await this.initializeAggregate();
            return this.finalize(aggregateToFinalize);
        }

        // 1. Initialize
        let currentAggregate: TAggregate = initialAggregate ?? await this.initializeAggregate(events[0]);

        // 2. Accumulate (The efficient single-pass O(N) asynchronous reduction)
        currentAggregate = await events.reduce(async (aggregatePromise, event) => {
            const aggregate = await aggregatePromise;
            return this.accumulate(aggregate, event);
        }, Promise.resolve(currentAggregate));

        // 3. Finalize
        return this.finalize(currentAggregate);
    }
}