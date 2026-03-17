// service/governance/V_Sync_Verification_Endpoint.js
import { StateCommitmentLedger } from '../persistence/StateCommitmentLedger';
import { TraceVetoContextRegistry } from '../persistence/TraceVetoContextRegistry';

/**
 * V_Sync_Verification_Endpoint (Verification Sync)
 * MISSION: Cryptographically verify the linkage and integrity of the DCSM
 * anchors (State Root Hash, TVCR Index) against core system registries.
 */

// Define standardized error codes for machine readability
const V_SYNC_CODES = {
    INVALID_MANIFEST: 'E_VSC001',
    SCL_MISMATCH: 'E_VSC002',
    TVCR_NOT_FOUND: 'E_VSC003',
    SUCCESS: 'VSC_OK'
};

/**
 * Executes concurrent lookup of the relevant commitment and context entries.
 * @param {string} epochId
 * @param {string} tvcrIndex
 * @returns {Promise<Object>} { ledgerEntry, tvcrEntry }
 */
async function retrieveAnchors(epochId, tvcrIndex) {
    const [ledgerEntry, tvcrEntry] = await Promise.all([
        StateCommitmentLedger.getCommitment(epochId),
        TraceVetoContextRegistry.retrieveContext(tvcrIndex)
    ]);
    return { ledgerEntry, tvcrEntry };
}

/**
 * Verifies the Decentralized System Commitment Manifest (DCSM).
 * Refactored to utilize concurrency and return standardized result objects.
 * @param {object} manifest - The DCSM payload.
 * @returns {Promise<{verified: boolean, code: string, reason: string, data: object}>}
 */
export async function verifyDCSM(manifest) {
    if (!manifest || !manifest.dse_epoch_id || !manifest.anchor_links) {
        return {
            verified: false,
            code: V_SYNC_CODES.INVALID_MANIFEST,
            reason: "DCSM Verification Error: Invalid or incomplete manifest payload.",
            data: {}
        };
    }

    const { anchor_links, dse_epoch_id } = manifest;
    const { state_root_hash, tvcr_index } = anchor_links;

    // Concurrently fetch required ledger entries
    const { ledgerEntry, tvcrEntry } = await retrieveAnchors(dse_epoch_id, tvcr_index);

    // 1. Check State Root Hash Integrity against Ledger
    if (!ledgerEntry || ledgerEntry.rootHash !== state_root_hash) {
        const storedHash = ledgerEntry ? ledgerEntry.rootHash : 'N/A';
        return {
            verified: false,
            code: V_SYNC_CODES.SCL_MISMATCH,
            reason: `SCL Failure for epoch ${dse_epoch_id}. Manifest Hash: ${state_root_hash}, Stored Hash: ${storedHash}.`,
            data: { storedHash, manifestHash: state_root_hash }
        };
    }

    // 2. Check TVCR Index Availability
    if (!tvcrEntry) {
        return {
            verified: false,
            code: V_SYNC_CODES.TVCR_NOT_FOUND,
            reason: `TVCR Failure: Trace/Veto context index ${tvcr_index} not found.`,
            data: { tvcr_index }
        };
    }

    // 3. Success confirmation
    return {
        verified: true,
        code: V_SYNC_CODES.SUCCESS,
        reason: `DCSM successfully verified against SCL and TVCR for epoch ${dse_epoch_id}.`,
        data: { dse_epoch_id, state_root_hash, tvcr_index }
    };
}