const fs = require('fs').promises;
const path = require('path');

/**
 * Executes a robust, potentially atomic move of a file artifact.
 * This is crucial for maintaining integrity during governance workflows 
 * by ensuring payloads are reliably moved from temporary staging 
 * to permanent quarantine/archive storage.
 * 
 * NOTE: This function expects absolute paths for stagingPath and quarantinePath.
 * 
 * @param {string} proposalId The unique identifier of the artifact.
 * @param {string} quarantinePath The absolute target directory for archiving.
 * @param {string} stagingPath The absolute source directory where the artifact currently resides.
 * @param {string} [fileExtension='.json'] The expected file extension.
 * @returns {Promise<boolean>} Resolves to true if the move was successful, false if the file didn't exist (ENOENT).
 * @throws {Error} Throws if the move fails for reasons other than ENOENT (e.g., permissions, disk I/O).
 */
async function archiveArtifact(proposalId, quarantinePath, stagingPath, fileExtension = '.json') {
    if (!proposalId || !quarantinePath || !stagingPath) {
        throw new Error("Archiving requires proposalId, quarantinePath, and stagingPath to be provided.");
    }

    const sourceFileName = `${proposalId}${fileExtension}`;
    const sourcePath = path.join(stagingPath, sourceFileName);
    const destinationPath = path.join(quarantinePath, sourceFileName);

    // 1. Ensure quarantine directory exists
    await fs.mkdir(quarantinePath, { recursive: true });

    // 2. Perform the atomic move (rename) operation.
    try {
        await fs.rename(sourcePath, destinationPath);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Artifact missing at source. Return false, allowing the caller to decide if this is critical.
            return false;
        }
        // Re-throw critical system failures
        throw new Error(`Archiving failed for artifact ${proposalId}: ${error.message}`);
    }
}

module.exports = {
    archiveArtifact,
};
