// Purpose: Validates the complex 'validationProof' defined in the FinalAxiomaticStateValidation schema.

import { GovernanceConfig } from '../../config/GovernanceConfig.js';
import { ValidatorRegistry } from './ValidatorRegistry.js';
import { verifySignature } from '../crypto/SignatureService.js';
import { ProofVerificationError } from '../../utils/errors/ProofVerificationError.js';

/**
 * Helper function to convert an array of validators into a lookup map (ID -> Validator Info).
 * Improves lookup efficiency from O(N) to O(1).
 * @param {Array<object>} validators
 * @returns {object}
 */
function indexValidators(validators) {
    return validators.reduce((map, v) => {
        if (v.id) map[v.id] = v;
        return map;
    }, {});
}

/**
 * Verifies the consensus proof attached to a finalized state record.
 * Executes optimized validation for cryptographic integrity and weighted consensus threshold.
 *
 * @param {object} proof - The ValidationProofStructure object (must contain signatures and thresholdMet).
 * @param {string} stateHash - The hash of the validated data.
 * @returns {boolean} True if the proof meets all axiomatic requirements.
 * @throws {ProofVerificationError} If the proof is structurally invalid.
 */
export async function verifyAxiomaticProof(proof, stateHash) {
    if (!proof || !stateHash || !proof.signatures || typeof proof.thresholdMet !== 'number') {
        throw new ProofVerificationError("Proof structure or state hash is invalid or incomplete.");
    }
    
    // 1. Prepare Validator Lookup and Calculate Total Weight
    const requiredThreshold = proof.thresholdMet;
    const eligibleValidators = await ValidatorRegistry.getEligibleValidators();

    if (eligibleValidators.length === 0) {
        // Cannot verify proof if there are no eligible validators registered.
        return false;
    }

    // Optimize lookup
    const validatorMap = indexValidators(eligibleValidators);
    
    const totalVotingWeight = eligibleValidators.reduce((sum, v) => sum + v.weight, 0);
    const requiredWeight = totalVotingWeight * requiredThreshold;

    let accumulatedWeight = 0;
    const validatedValidatorIds = new Set(); // Tracks unique validators that provided a valid signature (Crucial for preventing double-counting)

    // 2. Iterate and Verify Signatures
    for (const signatureAttestation of proof.signatures) {
        const validatorId = signatureAttestation.validatorId;

        // Basic validation
        if (!validatorId || !signatureAttestation.signature) {
            continue;
        }

        const validatorInfo = validatorMap[validatorId];
        
        // Check 1: Validator must be active/known
        if (!validatorInfo) {
             continue;
        }

        // Check 2: Prevent double-counting (must only count weight once per unique validator ID)
        if (validatedValidatorIds.has(validatorId)) {
            continue; 
        }

        // 3. Verify cryptographic signature
        // Message binding ensures signature is valid for this specific state, mechanism, and nonce.
        const messageToVerify = `${stateHash}:${proof.consensusMechanism}:${signatureAttestation.nonce}`;

        const isValidSignature = await verifySignature(
            messageToVerify,
            signatureAttestation.signature,
            validatorInfo.publicKey
        );

        if (isValidSignature) {
            accumulatedWeight += validatorInfo.weight;
            validatedValidatorIds.add(validatorId); 
            
            // Optimization: Early exit if threshold is reached
            if (accumulatedWeight >= requiredWeight) {
                return true;
            }
        }
    }

    // 4. Final Check 
    return accumulatedWeight >= requiredWeight;
}