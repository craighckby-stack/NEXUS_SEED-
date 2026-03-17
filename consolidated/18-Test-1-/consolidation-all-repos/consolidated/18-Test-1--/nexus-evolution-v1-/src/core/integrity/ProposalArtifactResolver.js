/**
 * @fileoverview ProposalArtifactResolver
 * This utility provides abstraction for fetching and resolving code artifacts
 * (file content, metadata, historical versions) needed during the Conceptual
 * Integrity check process.
 * It abstracts away filesystem details or mutation staging access for the Policy Evaluator.
 */

import { FileSystemAdapter } from '../../services/FileSystemAdapter.js'; // Assumed dependency

export const ProposalArtifactResolver = {

    /**
     * Fetches the current content of a file based on the proposal context.
     * If the file is part of the proposal, returns the modified/new content (if applicable).
     * @param {string} path
     * @param {Object} proposal The overall proposal context.
     * @returns {string|null}
     */
    getCurrentContent(path, proposal) {
        // 1. Check if the file is part of the active proposal/mutation stage.
        const change = proposal.affectedFiles.find(f => f.path === path);

        if (change) {
            // Use the contentAfter field from the change object if available (post-mutation view)
            return change.contentAfter || null;
        }
        
        // 2. If unaffected by the proposal, fetch from the current stable filesystem/repository view.
        try {
            return FileSystemAdapter.readFile(path);
        } catch (e) {
            console.warn(`[ArtifactResolver] Could not read file content for path: ${path}`);
            return null;
        }
    },

    /**
     * Fetches content required for a policy evaluation against a specific context.
     * Designed to be flexible for use by ConceptualPolicyEvaluator.
     * @param {Object} context The context object provided by CIE (contains proposal details, filePath, scope).
     * @returns {Object} { content: string, exists: boolean }
     */
    resolveArtifactContext(context) {
        const path = context.filePath;

        if (!path) {
             return { content: null, exists: false };
        }
        
        // For simplicity, rely on getCurrentContent logic
        const content = ProposalArtifactResolver.getCurrentContent(path, context.proposalDetails || {});

        return {
            content: content,
            exists: content !== null
        };
    }
    
    // Future extensions: getContentBeforeMutation(path, proposalId), getRelatedFiles(path)
};
