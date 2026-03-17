/**
 * GSIM Map Resolver v1.0
 * Handles integrity verification and dependency pre-loading for GSIM Enforcement Maps.
 */

import { GsimEnforcementMap, EnforcementRule } from '../types/gsim_types';

/**
 * Define the interface for the extracted tools.
 */
interface IPayloadIntegrityVerifier {
    verify(args: { payload: any, expectedChecksum: string }): Promise<{ isValid: boolean, calculatedChecksum: string | null }>;
}

/**
 * New interface for Dependency Resolution.
 * Abstracts the logic for fetching schemas, configs, and key references.
 */
interface IDependencyResolver {
    resolveDependencies(dependencies: EnforcementRule['dependencies']): Promise<void>;
}


interface GSIMResolverTools {
    payloadIntegrityVerifier: IPayloadIntegrityVerifier;
    dependencyResolver: IDependencyResolver;
}

export class GSIMMapResolver {
    private readonly #integrityVerifier: IPayloadIntegrityVerifier;
    private readonly #dependencyResolver: IDependencyResolver;

    constructor(tools: GSIMResolverTools) {
        this.#integrityVerifier = tools.payloadIntegrityVerifier;
        this.#dependencyResolver = tools.dependencyResolver;
    }

    /**
     * 1. Validates the integrity of the map data against the declared checksum (using tool).
     * 2. Pre-resolves and caches required external dependencies based on type.
     * @param mapData The parsed GSIM enforcement map.
     */
    public async resolve(mapData: GsimEnforcementMap): Promise<EnforcementRule[]> {
        const { map_id, metadata, enforcement_map } = mapData;

        this.#logResolutionAttempt(map_id);

        // 1. Integrity Verification
        const verificationResult = await this.#delegateToIntegrityVerification(
            enforcement_map,
            metadata.checksum
        );

        if (!verificationResult.isValid) {
            this.#throwIntegrityError(
                map_id,
                metadata.checksum,
                verificationResult.calculatedChecksum
            );
        }

        // 2. Dependency Resolution Loop
        for (const rule of enforcement_map) {
            if (rule.dependencies) {
                await this.#delegateToDependencyResolution(rule.dependencies);
            }
        }

        this.#logSuccess(map_id);
        return enforcement_map;
    }

    // --- I/O Proxy Functions ---

    /** Proxies interaction with the IPayloadIntegrityVerifier tool. */
    private async #delegateToIntegrityVerification(
        payload: any,
        expectedChecksum: string
    ): Promise<Awaited<ReturnType<IPayloadIntegrityVerifier['verify']>>> {
        return this.#integrityVerifier.verify({ payload, expectedChecksum });
    }

    /** Proxies interaction with the IDependencyResolver tool. */
    private async #delegateToDependencyResolution(dependencies: EnforcementRule['dependencies']): Promise<void> {
        // dependencies is guaranteed non-null by the caller context (resolve loop).
        return this.#dependencyResolver.resolveDependencies(dependencies!);
    }

    /** Proxies console logging for successful resolution. */
    private #logResolutionAttempt(mapId: string): void {
        console.log(`[GSIM] Attempting resolution for map ID: ${mapId}`);
    }

    /** Proxies console logging for successful resolution. */
    private #logSuccess(mapId: string): void {
        console.log(`[GSIM] Map ${mapId} resolved successfully.`);
    }

    /** Proxies error throwing upon failed integrity check. */
    private #throwIntegrityError(mapId: string, expected: string, calculated: string | null): never {
        const calculatedStr = calculated || 'N/A';
        throw new Error(`Integrity Check Failed for ${mapId}. Hash mismatch. Expected: ${expected}, Calculated: ${calculatedStr}.`);
    }
}