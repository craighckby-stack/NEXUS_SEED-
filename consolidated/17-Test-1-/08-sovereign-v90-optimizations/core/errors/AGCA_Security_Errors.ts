/**
 * Defines structured errors for cryptographic and authorization failures within the AGCA Validation Service.
 * Errors are generated via the StructuredErrorFactoryUtility to ensure canonical structure, logging codes, and prototype chain integrity.
 */

// Note: Assuming StructuredErrorFactory is accessible via kernel context or import mechanism.
// In a real AGI kernel execution environment, 'StructuredErrorFactory' would be injected or globally available.

declare const StructuredErrorFactory: {
    createBase: (name: string) => {
        new(message: string, code: string): Error & { code: string };
        prototype: Error;
    };
    create: (
        BaseClass: Function,
        errorName: string,
        defaultCode: string
    ) => {
        new(message: string): Error & { code: string };
        prototype: Error;
    };
};

/** Helper to define and freeze the canonical error codes. */
const _defineErrorCodes = () => Object.freeze({
    INTEGRITY_CHECK_FAILED: 'INTEGRITY_CHECK_FAILED',
    SIGNATURE_VERIFICATION_FAILED: 'SIGNATURE_VERIFICATION_FAILED',
    AGENT_AUTHORIZATION_DENIED: 'AGENT_AUTHORIZATION_DENIED',
} as const);

/** Canonical error codes used by the AGCA Validation Service. Immediately frozen to guarantee immutability. */
const AGCA_ERROR_CODES = _defineErrorCodes();

/** Base error for all AGCA Validation failures. Requires explicit code definition on instantiation. */
export const AGCA_ValidationError = StructuredErrorFactory.createBase('AGCA_ValidationError');
export type AGCA_ValidationError = InstanceType<typeof AGCA_ValidationError>;

/** Error specific to hash mismatch or data tampering. */
export const AGCA_IntegrityError = StructuredErrorFactory.create(
    AGCA_ValidationError,
    'AGCA_IntegrityError',
    AGCA_ERROR_CODES.INTEGRITY_CHECK_FAILED
);
export type AGCA_IntegrityError = InstanceType<typeof AGCA_IntegrityError>;

/** Error specific to invalid or failed cryptographic signature verification. */
export const AGCA_SignatureVerificationError = StructuredErrorFactory.create(
    AGCA_ValidationError,
    'AGCA_SignatureVerificationError',
    AGCA_ERROR_CODES.SIGNATURE_VERIFICATION_FAILED
);
export type AGCA_SignatureVerificationError = InstanceType<typeof AGCA_SignatureVerificationError>;

/** Error specific to the agent lacking necessary permissions (policy denial). */
export const AGCA_AuthorizationError = StructuredErrorFactory.create(
    AGCA_ValidationError,
    'AGCA_AuthorizationError',
    AGCA_ERROR_CODES.AGENT_AUTHORIZATION_DENIED
);
export type AGCA_AuthorizationError = InstanceType<typeof AGCA_AuthorizationError>;
