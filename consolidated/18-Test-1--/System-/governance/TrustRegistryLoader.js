// TrustAnchorRegistry.json holds critical immutable data for cryptographic trust roots.
// It must be loaded and validated early in the execution lifecycle.

const TrustAnchorRegistry = require('../assets/Config/TrustAnchorRegistry.json');
// Requires G0_Rules for mandatory future validation, adhering to Immutable Ancestry.
// const G0Rules = require('./G0_Rules'); 

/**
 * Provides read-only access to the defined Trust Anchors.
 * @returns {object} The Trust Anchor map.
 */
function getTrustAnchors() {
    return TrustAnchorRegistry.trust_anchors;
}

/**
 * Retrieves the entire raw registry metadata.
 * @returns {object} Metadata structure.
 */
function getRegistryMetadata() {
    return {
        registry_name: TrustAnchorRegistry.registry_name,
        version: TrustAnchorRegistry.version,
        description: TrustAnchorRegistry.description
    };
}

module.exports = {
    getTrustAnchors,
    getRegistryMetadata
};