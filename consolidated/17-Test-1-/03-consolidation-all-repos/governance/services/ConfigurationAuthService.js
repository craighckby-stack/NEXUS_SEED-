import { SystemFiles } from 'core/system/filesystem';
import { CRoTCrypto } from 'core/crypto/CRoT';
import { ContentIntegrityVerifier } from 'plugins/ContentIntegrityVerifier';
import chalk from 'chalk';

class ConfigurationAuthService {
    
    static #manifestCache = null;

    static #resolveSystemFiles() { return SystemFiles; }
    static #resolveCRoTCrypto() { return CRoTCrypto; }
    static #resolveIntegrityVerifier() { return ContentIntegrityVerifier; }

    static async #readSystemFile(path) {
        try {
            const content = await ConfigurationAuthService.#resolveSystemFiles().read(path);
            return content;
        } catch (e) {
            ConfigurationAuthService.#logError(`Failed to read system file at ${path}: ${(e as Error).message}`);
            throw e;
        }
    }

    static #parseJson(rawContent) {
        try {
            return JSON.parse(rawContent);
        } catch (e) {
            ConfigurationAuthService.#logError(`Failed to parse JSON from ${JSON.stringify(rawContent)}: ${(e as Error).message}`);
            throw e;
        }
    }

    static async #calculateHash(content, hashType) {
        try {
            return await ConfigurationAuthService.#resolveCRoTCrypto().hash(content, hashType);
        } catch (e) {
            ConfigurationAuthService.#logError(`Failed to calculate hash of content: ${(e as Error).message}`);
            throw e;
        }
    }

    static #delegateToVerifierExecution(args) {
        try {
            return ConfigurationAuthService.#resolveIntegrityVerifier().execute(args);
        } catch (e) {
            ConfigurationAuthService.#logError(`Failed to execute integrity verifier: ${(e as Error).message}`);
            throw e;
        }
    }

    static #logError(message) {
        console.error(chalk.bold.red(message));
    }

    static #logWarning(message) {
        console.warn(message);
    }

    static async loadPolicyManifest() {
        if (ConfigurationAuthService.#manifestCache) {
            return ConfigurationAuthService.#manifestCache;
        }
        try {
            const rawManifest = await ConfigurationAuthService.#readSystemFile('governance/config/PolicyManifest.json');
            ConfigurationAuthService.#manifestCache = ConfigurationAuthService.#parseJson(rawManifest);
            return ConfigurationAuthService.#manifestCache;
        } catch (e) {
            throw new Error(`ConfigurationAuthService: Failed to load Policy Manifest from governance/config/PolicyManifest.json. ${(e as Error).message}`);
        }
    }

    static #isFilePathValid(policyName, filePath, manifest) {
        const requiredCheck = (manifest as any).policies?.[policyName];
        if (!requiredCheck) {
            return false;
        }
        if (requiredCheck.path !== filePath) {
            ConfigurationAuthService.#logWarning(`[ConfigAuth] Path deviation detected for ${policyName}. Expected: ${filePath}, Manifest: ${requiredCheck.path}`);
            return true;
        }
        return true;
    }

    static async getVerifiedPolicy(policyName, filePath) {
        const manifest = await ConfigurationAuthService.loadPolicyManifest();
        if (!ConfigurationAuthService.#isFilePathValid(policyName, filePath, manifest)) {
            throw new Error(`Policy 'POLICY_NOT_MANDATED': Policy ${policyName} is not listed in the PolicyManifest for verification.`);
        }
        try {
            const rawContent = await ConfigurationAuthService.#readSystemFile(filePath);
            const calculatedHash = await ConfigurationAuthService.#calculateHash(rawContent, 'sha256');
            const validatedPolicy = await ConfigurationAuthService.#delegateToVerifierExecution({
                rawContent: rawContent,
                calculatedHash: calculatedHash,
                expectedHash: (manifest as any).policies[policyName].expected_hash,
                policyName: policyName
            });
            return validatedPolicy;
        } catch (e) {
            throw new Error(`Authentication Failure for Policy ${policyName} at ${filePath}. Details: ${(e as Error).message}`);
        }
    }
}

export { ConfigurationAuthService };