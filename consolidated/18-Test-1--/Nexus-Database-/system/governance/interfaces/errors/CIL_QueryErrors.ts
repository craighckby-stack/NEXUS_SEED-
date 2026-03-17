/**
 * CIL_QueryErrors.ts
 * Description: Defines structured exception handling classes for the CIL_BlockQuery_Interface.
 */

export class CILQueryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CILQueryError';
        Object.setPrototypeOf(this, CILQueryError.prototype);
    }
}

export class CILNotFoundError extends CILQueryError {
    constructor(queryId: string, message = `CIL Block not found for identifier: ${queryId}`) {
        super(message);
        this.name = 'CILNotFoundError';
    }
}

export class CILIntegrityError extends CILQueryError {
    constructor(blockNumber: number, message = `CIL Block integrity check failed for block ${blockNumber}`) {
        super(message);
        this.name = 'CILIntegrityError';
    }
}

export class CILMismatchError extends CILQueryError {
    constructor(expectedHash: string, actualHash: string, message = `Hash mismatch detected. Expected ${expectedHash.substring(0, 10)}...`) {
        super(message);
        this.name = 'CILMismatchError';
    }
}

export class CILBlockIntegrityViolation extends CILIntegrityError {
    constructor(blockNumber: number, detail: string) {
        super(blockNumber, `Integrity violation detected in block ${blockNumber}. Details: ${detail}`);
        this.name = 'CILBlockIntegrityViolation';
    }
}
