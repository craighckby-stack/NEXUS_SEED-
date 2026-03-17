/**
 * Integrity Verification Agent (IVA) V94.2
 * MISSION: Periodically verify all deployed components against the active WCIM.
 * Refactored for concurrency, explicit error handling, structured reporting, and externalized hashing utility.
 */

// Use modern fs/promises API
const fsPromises = require('fs/promises'); 
const path = require('path');

// --- AGI-KERNEL PLUGIN UTILIZATION ---
// Placeholder for the external StreamingHashCalculator utility provided by the Kernel.
const StreamingHashCalculator = {
    /** 
     * @param {{filePath: string, algorithm: string}} args
     * @returns {Promise<string>} 
     */
    execute: async (args) => {
        // NOTE: In a live environment, this calls the logic defined in the 'plugin' block.
        // We assume kernel plumbing provides this functionality via global or environment injection.
        throw new Error("Kernel plugin 'StreamingHashCalculator' required but not loaded.");
    }
};

class IntegrityVerificationAgent {
    /**
     * @param {object} manifestData - The pre-parsed, trusted Workload Configuration and Integrity Manifest (WCIM).
     * @param {string} [deploymentBaseDir='./executables'] - Base directory where components reside.
     */
    constructor(manifestData, deploymentBaseDir = './executables') {
        if (!manifestData || typeof manifestData !== 'object' || !manifestData.certified_executables) {
            throw new Error("IVA Initialization Error: Valid WCIM manifest data required.");
        }
        this.manifest = manifestData;
        this.baseDir = path.resolve(deploymentBaseDir);
        this.verificationLog = [];
    }

    /**
     * Static helper to load and parse a manifest asynchronously from disk.
     */
    static async loadManifestFromPath(manifestPath) {
        try {
            const data = await fsPromises.readFile(manifestPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`IVA Load Error: Cannot read or parse manifest from ${manifestPath}. Reason: ${error.message}`);
        }
    }
    
    async verifyComponent(component) {
        // Assumes standard component file naming convention (.js)
        const modulePath = path.join(this.baseDir, component.module + '.js'); 
        
        // Validate manifest entry integrity requirements
        if (!component.canonical_hash || !component.canonical_hash.value || !component.canonical_hash.algorithm) {
             this.logVerification(component.module, 'SKIP', null, `Manifest entry lacks canonical hash specification.`);
             return { status: 'SKIP', module: component.module, integrityMatch: true }; // Skip treated as neutral success
        }
        
        const expectedHash = component.canonical_hash.value.toLowerCase();
        // Standardize algorithm input (e.g., SHA3-512 -> sha3512)
        const algorithm = component.canonical_hash.algorithm.replace(/[-_]/g, '').toLowerCase(); 

        let actualHash = null;
        let status = 'FAIL';
        let reason = null;

        try {
            // V94.2: Utilizing external StreamingHashCalculator plugin for file hashing.
            actualHash = await StreamingHashCalculator.execute({ 
                filePath: modulePath, 
                algorithm: algorithm 
            });
            
            if (actualHash === expectedHash) {
                status = 'PASS';
            } else {
                reason = `Hash mismatch detected. Expected: ${expectedHash}. Actual: ${actualHash.substring(0, 8)}...`;
            }
        } catch (e) {
            status = 'ERROR';
            reason = e.message; 
        }

        this.logVerification(component.module, status, actualHash, reason, expectedHash);
        
        return {
            module: component.module,
            integrityMatch: status === 'PASS',
            status: status,
            reason: reason 
        };
    }
    
    logVerification(moduleName, status, actualHash, reason = null, expectedHash = null) {
         this.verificationLog.push({
            module: moduleName,
            status: status,
            expected: expectedHash,
            actual: actualHash,
            reason: reason,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Runs verification in parallel using Promise.all for high efficiency.
     * @returns {Promise<object>} Structured summary report.
     */
    async runVerification() {
        console.log(`[IVA] Starting parallel integrity sweep for environment: ${this.manifest.target_environment}...`);
        this.verificationLog = []; 

        const verificationPromises = this.manifest.certified_executables.map(component => 
            this.verifyComponent(component)
        );
        
        const results = await Promise.all(verificationPromises);

        // Overall success depends on no FAIL or ERROR statuses (SKIP is treated as neutral/successful entry check).
        const overallSuccess = results.every(r => r.status === 'PASS' || r.status === 'SKIP');

        const summary = {
            target: this.manifest.target_environment,
            timestamp: new Date().toISOString(),
            overallSuccess: overallSuccess,
            totalComponents: results.length,
            passed: results.filter(r => r.status === 'PASS').length,
            failed: results.filter(r => r.status === 'FAIL').length,
            errors: results.filter(r => r.status === 'ERROR').length,
            skipped: results.filter(r => r.status === 'SKIP').length,
            log: this.verificationLog
        };

        this.outputReport(summary);

        return summary;
    }

    outputReport(summary) {
        console.log('\n--- IVA Verification Report ---');
        console.log(`Target: ${summary.target} | Total Verified: ${summary.totalComponents}`);
        console.log(`Overall Result: ${summary.overallSuccess ? 'CLEAN (V94.2 Verified)' : 'INTEGRITY BREACH DETECTED'}`);
        
        const failures = summary.log.filter(l => l.status === 'FAIL' || l.status === 'ERROR');
        if (failures.length > 0) {
             console.error(`\n[CRITICAL] Detected ${failures.length} integrity violations or critical errors.`);
             failures.forEach(f => {
                 console.error(`  [${f.status}] ${f.module}: ${f.reason}`);
             });
             if (!summary.overallSuccess) {
                 console.error('\n*** SECURITY WARNING: Halt System Operation Due to Integrity Failure. ***');
             }
        } else {
             console.log(`All required components passed integrity checks.`);
        }
        console.log('-------------------------------\n');
    }
}

module.exports = IntegrityVerificationAgent;
module.exports.loadManifestFromPath = IntegrityVerificationAgent.loadManifestFromPath;