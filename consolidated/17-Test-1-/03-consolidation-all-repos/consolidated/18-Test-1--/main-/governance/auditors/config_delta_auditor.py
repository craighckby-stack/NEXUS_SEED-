import console from 'console';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

class IntegrityHalt extends Error {
    constructor(message) {
        super(message);
        this.name = 'IntegrityHalt';
    }
}

class ConfigurationDeltaAuditor {
    constructor(sealed_manifest) {
        if (!Object.keys(sealed_manifest).length) {
            throw new Error('Sealed manifest must be a non-empty dictionary.');
        }
        
        this.manifest = sealed_manifest;
        this.HASH_ALGORITHM = 'sha256';
        this.READ_CHUNK_SIZE = 65536;
    }

    static hashFile(filePath) {
        return new Promise((resolve, reject) => {
            crypto.createHash('sha256')
                .update(fs.readFileSync(filePath))
                .digest('hex', (err, hash) => {
                    if (err) {
                        reject(new IntegrityHalt(err));
                    }
                    resolve(hash);
                });
        });
    }

    async _calculateHash(file_path) {
        try {
            const hash = await this.hashFile(file_path);
            return hash;
        } catch (err) {
            throw new IntegrityHalt(`P-M02 IO Error calculating hash for critical path: ${file_path}. Details: ${err}`);
        }
    }

    async executeAuditCycle() {
        for (const [path, baselineHash] of Object.entries(this.manifest)) {
            const currentHash = await this._calculateHash(path);
            
            if (!currentHash) {
                throw new IntegrityHalt(`P-M02 Critical Configuration Missing: ${path}`);
            }
            
            if (currentHash !== baselineHash.slice(-8)) {
                throw new IntegrityHalt(
                    `P-M02 Configuration Delta detected on: ${path}. `
                    + `Baseline Hash: ${baselineHash.slice(0, -8)}... , Current Hash: ${currentHash.slice(-8)}...`
                );
            }
        }
        
        return true;
    }

    async getAuditTargets() {
        return Object.keys(this.manifest);
    }
}

async function main() {
    const sealedManifest = {
        '/path/to/file1': 'expectedHash1',
        '/path/to/file2': 'expectedHash2',
        // add more file paths and hashes here
    };
    
    const auditor = new ConfigurationDeltaAuditor(sealedManifest);
    try {
        const result = await auditor.executeAuditCycle();
        console.log(result);
    } catch (err) {
        console.error(err);
    }
    
    const auditTargets = await auditor.getAuditTargets();
    console.log(auditTargets);
}

main();