/**
 * CIL_QueryErrors.ts
 * Description: Defines structured exception handling classes for the CIL_BlockQuery_Interface.
 */

declare const StructuredErrorDetailFormatter: {
    formatMismatchMessage(expectedHash: string, actualHash: string): string;
    formatNotFoundMessage(queryId: string): string;
    formatIntegrityMessage(blockNumber: number): string;
    formatViolationMessage(blockNumber: number, detail: string): string;
};

export class CILQueryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CILQueryError';
        // Removed manual Object.setPrototypeOf as modern ES6+ environments handle prototype chain correctly when extending Error.
    }
}

export class CILNotFoundError extends CILQueryError {
    constructor(queryId: string, message?: string) {
        const defaultMessage = StructuredErrorDetailFormatter.formatNotFoundMessage(queryId);
        super(message || defaultMessage);
        this.name = 'CILNotFoundError';
    }
}

export class CILIntegrityError extends CILQueryError {
    constructor(blockNumber: number, message?: string) {
        const defaultMessage = StructuredErrorDetailFormatter.formatIntegrityMessage(blockNumber);
        super(message || defaultMessage);
        this.name = 'CILIntegrityError';
    }
}

export class CILMismatchError extends CILQueryError {
    constructor(expectedHash: string, actualHash: string, message?: string) {
        // Delegate complex message formatting, including hash truncation, to the utility tool.
        const defaultMessage = StructuredErrorDetailFormatter.formatMismatchMessage(expectedHash, actualHash);
        super(message || defaultMessage);
        this.name = 'CILMismatchError';
    }
}

export class CILBlockIntegrityViolation extends CILIntegrityError {
    constructor(blockNumber: number, detail: string) {
        // Generate the specific violation message using the formatter.
        const specificMessage = StructuredErrorDetailFormatter.formatViolationMessage(blockNumber, detail);
        // Pass the block number and the specific message up to CILIntegrityError
        super(blockNumber, specificMessage);
        this.name = 'CILBlockIntegrityViolation';
    }
}