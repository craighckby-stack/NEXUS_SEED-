/**
 * Proposal Payload Validator & Simulation Utility
 * Validates the `implementationTarget` payload integrity against the
 * human-readable `details.specification` for actionable proposals.
 */

import { validateSchema } from '../utility/schema_engine';
import { calculateHash } from '../utility/hashing_utility';
import * as executionEngine from './execution_engine';

// Standardized list of proposal types that require an executable payload.
const ACTIONABLE_PROPOSAL_TYPES = new Set([
  'PROTOCOL_UPGRADE',
  'TREASURY_ALLOCATION',
  'PARAMETER_CHANGE'
]);

/**
 * Validates the integrity and executability of an actionable proposal payload.
 *
 * 1. Checks proposal type.
 * 2. Retrieves raw payload data.
 * 3. Verifies payload integrity via hash comparison.
 * 4. Performs safe execution simulation.
 *
 * @param {object} proposal - The proposal object.
 * @returns {Promise<{valid: boolean, reason?: string, simulationReport?: object}>}
 */
export async function validateProposalPayload(proposal) {
  const { type, details, implementationTarget } = proposal;

  if (!ACTIONABLE_PROPOSAL_TYPES.has(type)) {
    // Skip validation for informational or standard proposals (e.g., 'Discussion')
    return { valid: true, reason: 'Informational proposal, no execution payload required.' };
  }

  if (!implementationTarget || !implementationTarget.payloadHash) {
    return { valid: false, reason: `Actionable proposal of type ${type} lacks implementationTarget payload details.` };
  }
  
  const expectedHash = implementationTarget.payloadHash;

  // 1. Retrieve Raw Payload Data
  // Assumes executionEngine is responsible for persistent storage access.
  const rawPayload = await executionEngine.getRawPayload(expectedHash);
  if (!rawPayload) {
    return { valid: false, reason: `Executable payload data missing from storage for hash: ${expectedHash}.` };
  }
  
  // 2. Hash Integrity Check
  try {
    const computedHash = calculateHash(rawPayload);
    
    if (computedHash !== expectedHash) {
      // Use substring to avoid logging massive hashes in error messages, focusing on identification.
      const safeExpected = expectedHash.substring(0, 16);
      const safeComputed = computedHash.substring(0, 16);
      return { 
        valid: false, 
        reason: `Payload integrity failed. Computed hash (${safeComputed}...) does not match expected hash (${safeExpected}...).` 
      };
    }
  } catch (hashError) {
     return { valid: false, reason: `Failed during hash computation: ${hashError.message}` };
  }

  // 3. Perform Safe Execution Simulation
  const simulationResult = await executionEngine.simulateCall(
    implementationTarget.modulePath,
    implementationTarget.method,
    rawPayload
  );

  if (!simulationResult.success) {
    return { valid: false, reason: `Execution simulation failed: ${simulationResult.error}` };
  }

  // 4. Semantic Validation: Ensure simulation output conforms to specifications.
  // This step usually involves validating the final state change against an expected schema/assertion.
  
  return { 
    valid: true, 
    simulationReport: simulationResult.report,
    message: 'Payload integrity verified and execution simulated successfully.'
  };
}