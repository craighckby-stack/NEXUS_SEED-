// core/hashing/Artifact_Hashing_Service.js
class ArtifactHashingService {
    constructor(defaultAlgorithm = HashingConfiguration.DEFAULT_ALGORITHM) {
        this._defaultAlgorithm = defaultAlgorithm;
        this._standardExclusions = HashingConfiguration.STANDARD_EXCLUSIONS;
    }

    _filterArtifactData(artifactData, exclusionKeys = null) {
        if (!exclusionKeys) {
            return Object.assign({}, artifactData);
        }

        exclusionKeys = new Set(exclusionKeys.split(','));

        const filteredData = {};
        for (const key in artifactData) {
            if (!exclusionKeys.has(key)) {
                filteredData[key] = artifactData[key];
            }
        }
        return filteredData;
    }

    _serializeArtifact(artifactData) {
        try {
            return JSON.stringify(Object.keys(artifactData).sort().reduce((acc, key) => {
                acc[key] = artifactData[key];
                return acc;
            }, {}), null, 2);
        } catch (e) {
            throw new ArtifactSerializationError(`Artifact data contains unserializable types: ${e}`);
        }
    }

    getCanonicalHash(artifactData, algorithm = null, exclusionKeys = null) {
        const hashAlg = algorithm ? algorithm : this._defaultAlgorithm;

        try {
            const processedData = this._filterArtifactData(artifactData, exclusionKeys);
            const serializedData = this._serializeArtifact(processedData);
            const h = crypto.createHash(hashAlg);
            h.update(serializedData);
            return h.digest('hex');
        } catch (e) {
            if (e instanceof HashingInitializationError || e instanceof ArtifactSerializationError || e instanceof RuntimeError) {
                throw e;
            }
            throw new RuntimeError(`Failed to generate canonical hash using ${hashAlg}: ${e}`);
        }
    }

    verifyArtifactIntegrity(expectedHash, artifactData, algorithm = null, exclusionKeys = null) {
        try {
            const calculatedHash = this.getCanonicalHash(artifactData, algorithm, exclusionKeys);
            return crypto.timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(calculatedHash, 'hex'));
        } catch (e) {
            return false;
        }
    }
}

class ArtifactSerializationError extends Error {}
class HashingInitializationError extends Error {}
class RuntimeError extends Error {}