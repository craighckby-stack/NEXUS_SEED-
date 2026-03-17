/**
 * Defines structured errors for cryptographic and authorization failures within the AGCA Validation Service.
 * Using specific classes simplifies error handling, debugging, and audit logging.
 */

export class AGCA_ValidationError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'AGCA_ValidationError';
        Object.setPrototypeOf(this, AGCA_ValidationError.prototype);
    }
}

/** Error specific to hash mismatch or data tampering. */
export class AGCA_IntegrityError extends AGCA_ValidationError {
    constructor(message: string) {
        super(message, 'INTEGRITY_CHECK_FAILED');
        this.name = 'AGCA_IntegrityError';
        Object.setPrototypeOf(this, AGCA_IntegrityError.prototype);
    }
}

/** Error specific to invalid or failed cryptographic signature verification. */
export class AGCA_SignatureVerificationError extends AGCA_ValidationError {
    constructor(message: string) {
        super(message, 'SIGNATURE_VERIFICATION_FAILED');
        this.name = 'AGCA_SignatureVerificationError';
        Object.setPrototypeOf(this, AGCA_SignatureVerificationError.prototype);
    }
}

/** Error specific to the agent lacking necessary permissions (policy denial). */
export class AGCA_AuthorizationError extends AGCA_ValidationError {
    constructor(message: string) {
        super(message, 'AGENT_AUTHORIZATION_DENIED');
        this.name = 'AGCA_AuthorizationError';
        Object.setPrototypeOf(this, AGCA_AuthorizationError.prototype);
    }
}