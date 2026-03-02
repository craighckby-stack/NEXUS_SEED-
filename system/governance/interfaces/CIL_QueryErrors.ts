/**
 * CIL_QueryErrors.ts
 * Description: Standardized, structured exceptions for Constraint Integrity Ledger (CIL) query operations.
 * Allows governance subsystems (GSEP, AICV) to differentiate validation failure types from resource availability failures,
 * supporting precise error remediation and state management.
 */

export abstract class CILBaseError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = this.constructor.name;
        // Ensure proper prototype chain for subclasses
        Object.setPrototypeOf(this, CILBaseError.prototype);
    }
}

/** Error 404 equivalent: The requested commitment or block index was not found. */
export class CILNotFoundError extends CILBaseError {
    constructor(message: string = "Requested CIL block or commitment ID was not found.") {
        super(message, 'CIL_NOT_FOUND');
    }
}

/** Error 409 equivalent: Detected a conflict between local constraint state and the ledger state. */
export class CILMismatchError extends CILBaseError {
    constructor(localHash: string, ledgerHash: string, blockNumber: number, message: string = `Root hash mismatch at block ${blockNumber}.`) {
        super(`${message} Local Hash: ${localHash}, Ledger Hash: ${ledgerHash}`, 'CIL_HASH_MISMATCH');
    }
}

/** Error: Block retrieved but cryptographic proofs failed internal validation (L3/L4 validation failure). */
export class CILIntegrityError extends CILBaseError {
    constructor(commitmentId: string, validationFailureReason: string, message: string = `Integrity check failed for commitment ${commitmentId}.`) {
        super(`${message} Reason: ${validationFailureReason}`, 'CIL_PROOF_INVALID');
    }
}

/** Error 503 equivalent: Ledger service or core persistence layer is unavailable. */
export class CILServiceUnavailableError extends CILBaseError {
    constructor(message: string = "CIL access layer is temporarily unavailable or degraded.") {
        super(message, 'CIL_SERVICE_UNAVAILABLE');
    }
}