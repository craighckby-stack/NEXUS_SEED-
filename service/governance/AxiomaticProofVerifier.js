// Purpose: Validates the complex 'validationProof' defined in the FinalAxiomaticStateValidation schema.

import { GovernanceConfig } from '../../config/GovernanceConfig.js';
import { ValidatorRegistry } from './ValidatorRegistry.js';
import { verifySignature } from '../crypto/SignatureService.js';

/**
 * Verifies the consensus proof attached to a finalized state record.
 * @param {object} proof - The ValidationProofStructure object.
 * @param {string} stateHash - The hash of the validated data.
 * @returns {boolean} True if the proof meets all axiomatic requirements.
 */
export async function verifyAxiomaticProof(proof, stateHash) {
    if (!proof.signatures || proof.signatures.length === 0) return false;

    const requiredThreshold = proof.thresholdMet;
    const activeValidators = await ValidatorRegistry.getEligibleValidators();
    const totalVotingWeight = activeValidators.reduce((sum, v) => sum + v.weight, 0);

    let accumulatedWeight = 0;
    const requiredWeight = totalVotingWeight * requiredThreshold;

    for (const signatureAttestation of proof.signatures) {
        const validatorInfo = activeValidators.find(v => v.id === signatureAttestation.validatorId);
        if (!validatorInfo) continue; // Validator not active or known

        // 1. Verify cryptographic signature
        const messageToVerify = `${stateHash}:${proof.consensusMechanism}:${signatureAttestation.nonce}`;
        const isValidSignature = await verifySignature(
            messageToVerify,
            signatureAttestation.signature,
            validatorInfo.publicKey
        );

        if (isValidSignature) {
            accumulatedWeight += validatorInfo.weight;
        }
    }

    // 2. Check if the required consensus threshold was reached
    return accumulatedWeight >= requiredWeight;
}
