/**
 * Proposal Success History Index (PSHI) v94.3 - Ultra-Efficiency Indexing (O(1) Pruning)
 * Stores and analyzes historical metadata concerning generated code proposals (AGI-C-14 output).
 * Utilizes indexed maps for O(1) access and a Doubly Linked List for O(1) FIFO pruning.
 * Refactored to enforce Dependency Injection and configuration isolation.
 */

/**
 * Interface for the required configuration registry.
 * @typedef {object} IProposalHistoryConfigRegistryKernel
 * @property {function(): number} getMaxHistorySize
 * @property {function(): number} getDecayFactor
 */

/**
 * Interface for the Exponential Moving Average utility.
 * @typedef {object} IExponentialMovingAverageToolKernel
 * @property {function(number, number): number} calculate
 */

class ProposalHistoryIndexKernel {
    /**
     * @param {IProposalHistoryConfigRegistryKernel} configRegistry - Configuration kernel providing constants (Max History Size).
     * @param {IExponentialMovingAverageToolKernel} emaCalculator - Pre-configured EMA utility instance (Decay Factor applied externally).
     */
    constructor(configRegistry, emaCalculator) {
        if (!configRegistry || !emaCalculator) {
            throw new Error("ProposalHistoryIndexKernel requires configRegistry and emaCalculator.");
        }

        this._configRegistry = configRegistry;
        this._emaCalculator = emaCalculator;
        
        this.#setupDependencies();

        // Index 1: Primary data store by proposal ID (O(1) access)
        this.proposalsById = new Map();

        // Index 2: Temporal Queue (Doubly Linked List simulation for O(1) FIFO pruning)
        // Replaces temporalQueueIds array to eliminate O(N) shift operation.
        this._head = null; 
        this._tail = null; 
        this._currentSize = 0; 

        // Index 3: Agent Performance Aggregates
        // { agentId: { successCount: N, failureCount: M, weightedAverageRate: W, recentScores: [] } }
        this.agentPerformanceMap = new Map(); 
        
        // Index 4: Contextual Failure Index (O(1) pattern bias lookup)
        this.failureTopologyIndex = new Map(); 
        this.totalFailureCount = 0; 
    }

    // Configuration and Tool setup isolated
    #setupDependencies() {
        this.maxHistorySize = this._configRegistry.getMaxHistorySize();
    }


    /**
     * Records a new proposal event, validates schema, and updates internal indices.
     * @param {object} eventData - Standardized proposal metrics payload.
     */
    recordProposalEvent(eventData) {
        if (!eventData || !eventData.proposal_id || !eventData.agent_id) {
            console.warn("[PSHI] Invalid event data structure encountered. Event rejected.");
            return false;
        }

        const normalizedEvent = {
            ...eventData,
            creation_timestamp: Date.now(),
            isSuccess: eventData.validation_status === 'ACCEPTED',
        };

        this._updateIndices(normalizedEvent);
        this._pruneHistory();
        
        return true;
    }

    /**
     * Helper to manage the O(1) FIFO ID queue (Doubly Linked List implementation).
     * Appends a new ID to the tail.
     * @param {string} id 
     */
    _appendId(id) {
        const newNode = { id, prev: this._tail, next: null };
        if (this._tail) {
            this._tail.next = newNode;
        } else {
            this._head = newNode;
        }
        this._tail = newNode;
        this._currentSize++;
    }

    /**
     * Helper to manage the O(1) FIFO ID queue.
     * Removes and returns the ID from the head (oldest).
     * @returns {string | null} The oldest ID removed.
     */
    _removeHead() {
        if (!this._head) return null;
        
        const removedNode = this._head;
        this._head = removedNode.next;
        
        if (this._head) {
            this._head.prev = null;
        } else {
            this._tail = null; // List is now empty
        }
        this._currentSize--;
        return removedNode.id;
    }


    /**
     * Helper to update all auxiliary maps upon event insertion.
     * @param {object} normalizedEvent - The event object ready for indexing.
     */
    _updateIndices(normalizedEvent) {
        const agentId = normalizedEvent.agent_id;
        const isSuccess = normalizedEvent.isSuccess;
        
        // 1. Update temporal history and lookups (O(1) insert)
        this._appendId(normalizedEvent.proposal_id); // O(1)
        this.proposalsById.set(normalizedEvent.proposal_id, normalizedEvent);

        // 2. Update agent performance aggregates (O(1) lookup/update)
        if (!this.agentPerformanceMap.has(agentId)) {
            this.agentPerformanceMap.set(agentId, {
                successCount: 0, 
                failureCount: 0, 
                weightedAverageRate: 0, 
                recentScores: []
            });
        }

        const stats = this.agentPerformanceMap.get(agentId);

        if (isSuccess) {
            stats.successCount++;
            const rateValue = normalizedEvent.actual_score_ciw !== undefined ? normalizedEvent.actual_score_ciw : 1.0;
            stats.weightedAverageRate = this._emaCalculator.calculate(stats.weightedAverageRate, rateValue);
        } else {
            stats.failureCount++;
            this.totalFailureCount++;
            stats.weightedAverageRate = this._emaCalculator.calculate(stats.weightedAverageRate, 0);
        }

        // Update recent CIW scores
        if (normalizedEvent.actual_score_ciw !== undefined) {
            stats.recentScores.push(normalizedEvent.actual_score_ciw);
            if (stats.recentScores.length > 50) {
                stats.recentScores.shift(); 
            }
        }

        // 3. Update contextual failure index (O(1) lookup/update)
        if (!isSuccess && normalizedEvent.failure_reason_tags && Array.isArray(normalizedEvent.failure_reason_tags)) {
            for (const tag of normalizedEvent.failure_reason_tags) {
                this._incrementTopologyCount(tag);
            }
        }
    }

    /**
     * Implements an O(1) removal pruning mechanism using the Doubly Linked List.
     */
    _pruneHistory() {
        while (this._currentSize > this.maxHistorySize) {
            const oldestId = this._removeHead(); // O(1) operation
            
            if (oldestId) {
                const oldEvent = this.proposalsById.get(oldestId);
                
                if (oldEvent) {
                    this.proposalsById.delete(oldestId);

                    // Decrease total failure count and topology counts upon removal (Decay)
                    if (!oldEvent.isSuccess) {
                        this.totalFailureCount--;
                        if (oldEvent.failure_reason_tags && Array.isArray(oldEvent.failure_reason_tags)) {
                            for (const tag of oldEvent.failure_reason_tags) {
                                this._decrementTopologyCount(tag);
                            }
                        }
                    }
                }
            }
        }
    }

    /** Increments topology count (private helper) */
    _incrementTopologyCount(tag) {
        this.failureTopologyIndex.set(tag, (this.failureTopologyIndex.get(tag) || 0) + 1);
    }

    /** Decrements topology count (private helper) */
    _decrementTopologyCount(tag) {
        const currentCount = this.failureTopologyIndex.get(tag);
        if (currentCount && currentCount > 1) {
            this.failureTopologyIndex.set(tag, currentCount - 1);
        } else {
            this.failureTopologyIndex.delete(tag);
        }
    }
    
    /**
     * Provides ARCH-ATM system with sophisticated historical performance data.
     * Efficiency: O(1) access to aggregated counts and pre-computed EMA.
     * @param {string} agentId - The ID of the agent.
     * @returns {{ rawRate: number, recentWeight: number, totalProposals: number, weightedTrustScore: number }}
     */
    calculateAgentSuccessRate(agentId) {
        const stats = this.agentPerformanceMap.get(agentId);
        
        if (!stats) {
            return { rawRate: 0, recentWeight: 0, totalProposals: 0, weightedTrustScore: 0 };
        }
        
        const total = stats.successCount + stats.failureCount;
        const rawRate = total > 0 ? (stats.successCount / total) : 0;
        
        // Average of recent CIW scores (less prone to long-term decay, measures recent quality)
        const recentWeight = stats.recentScores.length > 0
            ? stats.recentScores.reduce((a, b) => a + b, 0) / stats.recentScores.length
            : 0;
            
        return {
            rawRate: rawRate,
            recentWeight: recentWeight,
            totalProposals: total,
            weightedTrustScore: stats.weightedAverageRate
        };
    }
}