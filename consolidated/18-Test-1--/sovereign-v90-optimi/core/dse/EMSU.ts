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

import { AASS } from './AASS';
import { ConfigurationRegistry } from '../registry/ConfigurationRegistry';
import { ISealingUtility } from './interfaces/ISealingUtility'; // Assuming standard import path for the abstracted utility


export class EMSU {
    // Enforcing strict encapsulation for core dependencies and making them readonly.
    private readonly #configRegistry: ConfigurationRegistry;
    private readonly #manifestSealer: ISealingUtility;

    // Static constant for DSE version ensures consistency and easy maintenance.
    private static readonly DSE_VERSION = 'v94.1';

    constructor(registry: ConfigurationRegistry, manifestSealer: ISealingUtility) {
        this.#configRegistry = registry;
        this.#manifestSealer = manifestSealer;
    }

    /**
     * S00: Executes the Pre-Flight Lock sequence (G0).
     * @returns The Sequence Authorization Token (SAT) containing the EMS signature.
     */
    public async generateAndSealManifest(chr_checksum: string): Promise<string> {
        // 1. Load critical hash dependencies (GAX III inputs)
        const governance_hashes = await this.#loadCriticalHashes();
        
        // 2. Compile the Epoch Manifest payload
        const manifestPayload = this.#compileManifestPayload(chr_checksum, governance_hashes);

        // 3. Utilize ManifestSealingUtility for canonicalization, hashing, and signing.
        const sealResult = await this.#delegateToSealingUtility(manifestPayload);

        const manifestHash = sealResult.manifestHash;
        const ems_signature = sealResult.ems_signature;
        
        // 4. Construct Sequence Authorization Token (SAT)
        const SAT = `${manifestHash}:${ems_signature}`;

        // 5. Store sealed manifest for P-R03 auditing
        await this.#storeSealedArtifact(manifestPayload);

        console.log(`[EMSU] G0 Lock Success. Manifest Hash: ${manifestHash}`);
        return SAT;
    }

    /**
     * Retrieves ACVM and PCRE hashes from the ConfigurationRegistry.
     * @private
     */
    private async #loadCriticalHashes(): Promise<{ acvmHash: string, policyHash: string }> {
        const acvmHash = await this.#configRegistry.getHash('config/acvm.json');
        const policyHash = await this.#configRegistry.getHash('config/pcre_policies.json');
        return { acvmHash, policyHash };
    }

    /**
     * Compiles the static Epoch Manifest payload.
     * @private
     */
    private #compileManifestPayload(chr_checksum: string, governance_hashes: { acvmHash: string, policyHash: string }): any {
        return {
            timestamp: new Date().toISOString(),
            dse_version: EMSU.DSE_VERSION,
            input_checksum_baseline: chr_checksum,
            governance_hashes: governance_hashes
        };
    }

    /**
     * Delegates execution to the external ISealingUtility dependency (I/O Proxy).
     * @private
     */
    private async #delegateToSealingUtility(manifestPayload: any): Promise<{ manifestHash: string, ems_signature: string }> {
        // This enforces a standardized integrity flow (GAX III inputs -> Manifest -> Seal).
        return this.#manifestSealer.execute({
            payload: manifestPayload,
            // AASS provides the necessary cryptographic primitives
            hasherFn: AASS.generateHash, 
            signerFn: AASS.sign, 
            sealContext: 'EpochManifestSeal'
        });
    }

    /**
     * Stores the generated manifest using the ConfigurationRegistry (I/O Proxy).
     * @private
     */
    private async #storeSealedArtifact(manifestPayload: any): Promise<void> {
        await this.#configRegistry.storeArtifact('protocol/epoch_manifest.json', manifestPayload);
    }
}