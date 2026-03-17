/**
 * DSCM (Decisional State Checkpoint Manager Kernel)
 * Role: Manages atomic, verifiable state capture prior to P-01 Calculus execution.
 * Activated: Boundary between GSEP Stage 3 and Stage 4 (Verification Boundary).
 */

import { MICM_Input } from './MICM'; // Assumed dependency interface
import { HashIntegrityCheckerToolKernel } from '../tools/HashIntegrityCheckerToolKernel';
import { ILoggerToolKernel } from '../logging/ILoggerToolKernel';
import { IChronologyFilterToolKernel } from '../tools/IChronologyFilterToolKernel'; // Newly formalized dependency

/**
 * Interface representing the key calculation context locked down at time of decision boundary.
 */
interface CalculationContext { 
    s01_model_id: string;      // Attested Trust Model version
    s02_rfci: string;          // Risk Floor Configuration Integrity hash
    telemetry_attestation: string; // TIAR input attestation hash
}

/**
 * The definitive, immutable record of the state immediately preceding the P-01 decision.
 * All fields are required for the self-referential 'snapshot_hash' verification.
 */
interface DSCM_StateSnapshot {
    checksum_micm: string;         // Integrity check against locked MICM inputs (Hash of MICM_Input)
    calculation_context: CalculationContext;
    timestamp_utc: string;         // ISO 8601 string for precise, auditable capture time
    snapshot_hash: string;         // Immutable cryptographic hash of the entire checkpoint data structure
}

export class DecisionalStateCheckpointManagerKernel {

    private checkpointHistory: DSCM_StateSnapshot[] = [];
    private readonly hasher: HashIntegrityCheckerToolKernel;
    private readonly chronologyFilter: IChronologyFilterToolKernel; 
    private readonly logger: ILoggerToolKernel;
    
    /**
     * Initializes the DSCM Kernel, requiring injected strategic kernel dependencies.
     */
    constructor(
        hasher: HashIntegrityCheckerToolKernel,
        chronologyFilter: IChronologyFilterToolKernel,
        logger: ILoggerToolKernel
    ) {
        this.hasher = hasher;
        this.chronologyFilter = chronologyFilter;
        this.logger = logger;
        this.#setupDependencies();
    }

    /**
     * Ensures all required dependencies are present and correctly structured.
     * @private
     */
    #setupDependencies(): void {
        if (!this.hasher || typeof this.hasher.hash !== 'function') {
            throw new Error("DecisionalStateCheckpointManagerKernel requires a valid HashIntegrityCheckerToolKernel.");
        }
        if (!this.chronologyFilter || typeof this.chronologyFilter.filterByCutoff !== 'function') {
            throw new Error("DecisionalStateCheckpointManagerKernel requires a valid IChronologyFilterToolKernel.");
        }
        if (!this.logger) {
            throw new Error("DecisionalStateCheckpointManagerKernel requires a valid ILoggerToolKernel.");
        }
    }

    /**
     * Takes an immutable, time-stamped checkpoint of the entire P-01 calculation context.
     * Ensures F-01 (Failure Trace) can accurately trace the exact state leading to the decision.
     * @param input Data locked by MICM.
     * @param telemetryHash Telemetry/Sensor input attestation hash (from TIAR).
     * @returns The generated DSCM state snapshot object.
     */
    public async createCheckpoint(input: MICM_Input, telemetryHash: string): Promise<DSCM_StateSnapshot> {    
        // 1. Lock down input data integrity (Asynchronous hashing)
        const checksum_micm = await this.hasher.hash(input);

        // 2. Define Context
        const calculation_context: CalculationContext = {
            s01_model_id: input.atm_version,
            s02_rfci: input.rfci_hash,
            telemetry_attestation: telemetryHash
        };

        // Capture time as high-fidelity ISO string for precise auditing
        const timestamp_utc = new Date().toISOString(); 
        
        // 3. Create provisional snapshot structure
        const provisionalSnapshot: Omit<DSCM_StateSnapshot, 'snapshot_hash'> = {
            checksum_micm,
            calculation_context,
            timestamp_utc
        };

        // 4. Generate final definitive hash based on the entire structure (Asynchronous hashing)
        const snapshot_hash = await this.hasher.hash(provisionalSnapshot);
        
        const snapshot: DSCM_StateSnapshot = {
            ...provisionalSnapshot,
            snapshot_hash
        };

        // Note: Checkpoint storage is a local operation, so synchronous push is acceptable.
        this.checkpointHistory.push(snapshot);
        this.logger.debug(`DSCM Checkpoint created successfully: ${snapshot_hash}`);

        return snapshot;
    }

    /**
     * Retrieves a specific checkpoint using its verified cryptographic hash.
     * @param hash The snapshot_hash identifier.
     */
    public async retrieveSnapshot(hash: string): Promise<DSCM_StateSnapshot | undefined> {
        // Wrapping local array search in async for architectural consistency
        return this.checkpointHistory.find(s => s.snapshot_hash === hash);
    }

    /**
     * Verifies the cryptographic integrity of a DSCM snapshot.
     * Ensures that the contents (checksum, context, timestamp) match the stored snapshot_hash.
     * @param snapshot The snapshot object to verify.
     * @returns True if the hash matches the content, false otherwise.
     */
    public async verifySnapshot(snapshot: DSCM_StateSnapshot): Promise<boolean> {
        const { snapshot_hash, ...provisional } = snapshot;
        
        // Requires deterministic serialization by the Hashing Kernel.
        const recalculatedHash = await this.hasher.hash(provisional);
        
        return recalculatedHash === snapshot_hash;
    }

    /**
     * Clears local history based on a minimum required timestamp (ISO 8601 string).
     * Delegates time comparison and filtering to the IChronologyFilterToolKernel.
     * @param cutoffIsoDate UTC ISO 8601 timestamp string defining the cutoff point.
     */
    public async purgeStaleSnapshots(cutoffIsoDate: string): Promise<void> {
        this.logger.info(`Initiating DSCM purge for snapshots older than ${cutoffIsoDate}.`);
        
        const initialCount = this.checkpointHistory.length;
        
        const filteredHistory = await this.chronologyFilter.filterByCutoff(
            this.checkpointHistory,
            'timestamp_utc',
            cutoffIsoDate
        );
        
        this.checkpointHistory = filteredHistory as DSCM_StateSnapshot[];

        const purgedCount = initialCount - this.checkpointHistory.length;
        if (purgedCount > 0) {
            this.logger.info(`DSCM successfully purged ${purgedCount} stale snapshots.`);
        }
    }
}