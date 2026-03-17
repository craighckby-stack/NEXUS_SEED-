declare const ArtifactArchiverUtility: {
    execute: (args: {
        proposalId: string;
        quarantinePath: string;
        stagingPath: string;
        fileExtension?: string;
    }) => Promise<{ success: boolean; destinationPath?: string; reason?: string }>;
};


/**
 * Executes a robust, potentially atomic move of a file artifact using the Kernel's utility.
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
async function archiveArtifact(proposalId: string, quarantinePath: string, stagingPath: string, fileExtension = '.json'): Promise<boolean> {
    if (!proposalId || !quarantinePath || !stagingPath) {
        throw new Error("Archiving requires proposalId, quarantinePath, and stagingPath to be provided.");
    }

    try {
        const result = await ArtifactArchiverUtility.execute({
            proposalId,
            quarantinePath,
            stagingPath,
            fileExtension,
        });

        if (result.success) {
            return true;
        }

        if (result.reason === 'ENOENT') {
            // Artifact missing at source.
            return false;
        }

        // Fallback for unexpected structured error from utility
        throw new Error(`Archiving failed for artifact ${proposalId}: Unexpected non-ENOENT failure.`);

    } catch (error) {
        // Catch critical errors thrown by the utility (permissions, disk I/O, etc.)
        if (error instanceof Error) {
            throw error;
        }
        // Fallback for non-Error type throws
        throw new Error(`Critical failure during archive process for ${proposalId}.`);
    }
}

module.exports = {
    archiveArtifact,
};