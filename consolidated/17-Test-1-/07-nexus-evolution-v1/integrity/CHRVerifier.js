/*
 * Module: Configuration Hash Registry (CHR) Verifier
 * Function: Provides synchronous methods for C-ICR validation.
 * Dependencies: Node 'fs', 'crypto'.
 *
 * 1. Loads 'integrity/baseline_chr.json'.
 * 2. Iterates over the 'registry' map.
 * 3. Computes the runtime SHA256 hash for each referenced file path.
 * 4. Compares runtime hash against the baseline hash.
 * 5. Returns a structured report detailing integrity status (PASS/FAIL) and logs discrepancies.
 * 6. (Advanced): Implement baseline self-validation and cryptographic signature checks if a signature is embedded.
 */

const fs = require('fs');
const crypto = require('crypto');

class CHRVerifier {
    constructor(baselinePath = 'integrity/baseline_chr.json') {
        this.baselinePath = baselinePath;
        this.baseline = this._loadBaseline();
    }

    _loadBaseline() {
        try {
            const data = fs.readFileSync(this.baselinePath, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            throw new Error(`CHR Initialization Failure: Could not load baseline registry. ${e.message}`);
        }
    }

    computeFileHash(filePath) {
        const hash = crypto.createHash(this.baseline.integrity_algorithm);
        const data = fs.readFileSync(filePath);
        hash.update(data);
        return hash.digest('hex');
    }

    async runValidation() {
        const results = [];
        let integrityOK = true;

        for (const cid in this.baseline.registry) {
            const entry = this.baseline.registry[cid];
            let status = 'PASS';
            let runtimeHash = null;
            let error = null;

            try {
                runtimeHash = this.computeFileHash(entry.path);
                
                // Skip validation if expected hash is placeholder (e.g., during registry generation)
                if (entry.hash !== '[GENERATE_RUNTIME_HASH]' && runtimeHash !== entry.hash) {
                    status = 'FAIL';
                    integrityOK = false;
                    error = 'Hash mismatch detected.';
                }

            } catch (e) {
                status = 'FAIL';
                integrityOK = false;
                error = `File read or compute error: ${e.message}`;
            }

            results.push({
                cid: cid,
                path: entry.path,
                status: status,
                expected: entry.hash,
                actual: runtimeHash,
                error: error
            });
        }

        return {
            integrity_status: integrityOK ? 'VALID' : 'COMPROMISED',
            algorithm: this.baseline.integrity_algorithm,
            details: results
        };
    }
}

module.exports = CHRVerifier;