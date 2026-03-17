/**
 * DEPRECATED: This file previously contained synchronous Governance Constants (G-03).
 * Access to FAILURE_STAGES, MANDATE_TYPES, and DEFAULT_RETRY_TARGET
 * must now be done asynchronously via the GovernanceConstantsV2ConfigRegistryKernel,
 * accessible through the IGovernanceConstantsV2ConfigRegistryKernel interface.
 * This change enforces high-integrity governance mandates (AIA Enforcement Layer).
 */

// Export an empty object to prevent unexpected synchronous imports from failing.
export const DEPRECATED_CONSTANTS = {};

