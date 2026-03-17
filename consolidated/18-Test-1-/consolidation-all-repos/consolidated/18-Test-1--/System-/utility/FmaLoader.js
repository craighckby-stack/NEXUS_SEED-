const FMA_CATALOG = require('../config/dictionary/fma_catalog.json');

/**
 * Utility class to load and access the Feature Mapping Artifact (FMA) Catalog.
 * This is essential for feature gating and governance compliance.
 */
class FmaLoader {
    /**
     * Returns the full FMA catalog array.
     */
    static getCatalog() {
        return FMA_CATALOG;
    }

    /**
     * Finds a specific FMA artifact by ID.
     */
    static getArtifactById(id) {
        return FMA_CATALOG.find(artifact => artifact.id === id);
    }
}

module.exports = FmaLoader;