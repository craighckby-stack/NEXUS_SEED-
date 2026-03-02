/**
 * DSCM (Decisional State Checkpoint Manager)
 * Role: Manages atomic, verifiable state capture prior to P-01 Calculus execution.
 * Activated: Boundary between GSEP Stage 3 and Stage 4 (Verification Boundary).
 */

import { MICM_Input } from './MICM';
import { IHasher } from '../system/interfaces/IHasher'; // Injected dependency

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

export class DecisionalStateCheckpointManager {

    private checkpointHistory: DSCM_StateSnapshot[] = [];
    private readonly hasher: IHasher;
    
    /**
     * Initializes the DSCM, requiring an injected Hashing Utility.
     * Replaces static dependency on AIA_Ledger with IHasher interface.
     * @param hasher Utility conforming to IHasher (e.g., AIA_Ledger abstraction).
     */
    constructor(hasher: IHasher) {
        this.hasher = hasher;
    }

    /**
     * Takes an immutable, time-stamped checkpoint of the entire P-01 calculation context.
     * This ensures F-01 (Failure Trace) can accurately trace the exact state leading to the decision.
     * @param input Data locked by MICM.
     * @param telemetryHash Telemetry/Sensor input attestation hash (from TIAR).
     * @returns The generated DSCM state snapshot object.
     */
    public createCheckpoint(input: MICM_Input, telemetryHash: string): DSCM_StateSnapshot {
        
        // 1. Lock down input data integrity
        const checksum_micm = this.hasher.hash(input);

        // 2. Define Context
        const calculation_context: CalculationContext = {
            s01_model_id: input.atm_version,
            s02_rfci: input.rfci_hash,
            telemetry_attestation: telemetryHash
        };

        // Capture time as high-fidelity ISO string for precise auditing
        const timestamp_utc = new Date().toISOString(); 
        
        // 3. Create provisional snapshot structure (everything needed for hashing)
        const provisionalSnapshot: Omit<DSCM_StateSnapshot, 'snapshot_hash'> = {
            checksum_micm,
            calculation_context,
            timestamp_utc
        };

        // 4. Generate final definitive hash based on the entire structure 
        const snapshot_hash = this.hasher.hash(provisionalSnapshot);
        
        const snapshot: DSCM_StateSnapshot = {
            ...provisionalSnapshot,
            snapshot_hash
        };

        this.checkpointHistory.push(snapshot);
        return snapshot;
    }

    /**
     * Retrieves a specific checkpoint using its verified cryptographic hash.
     * @param hash The snapshot_hash identifier.
     */
    public retrieveSnapshot(hash: string): DSCM_StateSnapshot | undefined {
        return this.checkpointHistory.find(s => s.snapshot_hash === hash);
    }

    /**
     * Verifies the cryptographic integrity of a DSCM snapshot.
     * Ensures that the contents (checksum, context, timestamp) match the stored snapshot_hash.
     * @param snapshot The snapshot object to verify.
     * @returns True if the hash matches the content, false otherwise.
     */
    public verifySnapshot(snapshot: DSCM_StateSnapshot): boolean {
        const { snapshot_hash, ...provisional } = snapshot;
        
        // Requires deterministic serialization by the IHasher implementation.
        const recalculatedHash = this.hasher.hash(provisional);
        
        return recalculatedHash === snapshot_hash;
    }

    /**
     * Clears local history based on a minimum required timestamp (ISO 8601 string).
     * Snapshots committed to D-01 or successfully resolved by F-01 should be pruned locally.
     * @param cutoffIsoDate UTC ISO 8601 timestamp string defining the cutoff point.
     */
    public purgeStaleSnapshots(cutoffIsoDate: string): void {
        const cutoffTime = new Date(cutoffIsoDate).getTime();

        this.checkpointHistory = this.checkpointHistory.filter(s => {
            const snapshotTime = new Date(s.timestamp_utc).getTime();
            return snapshotTime > cutoffTime;
        });
    }
}