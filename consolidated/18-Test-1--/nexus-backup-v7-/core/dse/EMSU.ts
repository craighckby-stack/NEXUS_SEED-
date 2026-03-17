/**
 * Epoch Manifest & Sealing Utility (EMSU)
 * Core responsibility: Enforce GAX III (Policy Immutability) and manage the G0 Pre-Flight Lock.
 *
 * The EMSU generates, hashes, and cryptographically seals the Epoch Manifest (EMS) based on:
 * 1. Current ACVM configuration hash.
 * 2. PCRE policy hash set.
 * 3. Environment variables critical to DSE instantiation.
 * 4. The initial system baseline integrity (CHR).
 *
 * Failure to generate or seal the EMS results in an immediate P-M02 Critical Fault, triggering IH.
 */

const { AASS } = require('./AASS');
const { ConfigurationRegistry } = require('../registry/ConfigurationRegistry');

class EMSU {
    
    constructor(registry /*: ConfigurationRegistry*/) {
        this.configRegistry = registry;
    }

    /**
     * S00: Executes the Pre-Flight Lock sequence (G0).
     * @returns {Promise<string>} The Sequence Authorization Token (SAT) containing the EMS signature.
     */
    async generateAndSealManifest(chr_checksum) {
        // 1. Load critical hash dependencies (GAX III inputs)
        const acvmHash = await this.configRegistry.getHash('config/acvm.json');
        const policyHash = await this.configRegistry.getHash('config/pcre_policies.json');
        
        // 2. Compile the Epoch Manifest payload
        const manifestPayload = {
            timestamp: new Date().toISOString(),
            // Updated DSE version to reflect protocol v94.2 activation
            dse_version: 'v94.2',
            input_checksum_baseline: chr_checksum,
            governance_hashes: { acvmHash, policyHash }
        };

        const manifestJSON = JSON.stringify(manifestPayload);
        const manifestHash = AASS.generateHash(manifestJSON);

        // 3. Cryptographically seal the manifest (GAX III enforcement)
        const ems_signature = await AASS.sign(manifestHash, 'EpochManifestSeal');
        
        // 4. Construct Sequence Authorization Token (SAT)
        const SAT = `${manifestHash}:${ems_signature}`;

        // 5. Store sealed manifest for P-R03 auditing
        await this.configRegistry.storeArtifact('protocol/epoch_manifest.json', manifestPayload);

        console.log(`[EMSU] G0 Lock Success. Manifest Hash: ${manifestHash}`);
        return SAT;
    }
}

module.exports = { EMSU };
