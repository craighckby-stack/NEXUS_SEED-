/**
 * @fileoverview ProposalArtifactResolverKernel
 * This kernel provides abstraction for fetching and resolving code artifacts
 * (file content, metadata, historical versions) needed during the Conceptual
 * Integrity check process, specifically against a pending proposal's staged state.
 * It enforces strict Dependency Injection and asynchronous operation.
 */

import { IProposalContentResolverToolKernel } from './IProposalContentResolverToolKernel';

interface ProposalFileChange {
    path: string;
    contentAfter: string | null;
}

interface ProposalContext {
    affectedFiles?: ProposalFileChange[];
    [key: string]: any;
}

interface ResolutionContext {
    filePath?: string;
    proposalDetails?: ProposalContext;
    [key: string]: any;
}

export class ProposalArtifactResolverKernel {
    #contentResolver: IProposalContentResolverToolKernel;

    /**
     * @param contentResolver The kernel responsible for resolving content based on proposal changes.
     */
    constructor(contentResolver: IProposalContentResolverToolKernel) {
        this.#setupDependencies(contentResolver);
    }

    /**
     * Ensures all required dependencies are present and assigns them.
     * Enforces the synchronous setup extraction mandate.
     * @param contentResolver The injected content resolver tool.
     */
    #setupDependencies(contentResolver: IProposalContentResolverToolKernel): void {
        if (!contentResolver || typeof contentResolver.resolveContent !== 'function') {
            throw new Error("Dependency Injection Error: IProposalContentResolverToolKernel is required.");
        }
        this.#contentResolver = contentResolver;
    }

    /**
     * Fetches the current content of a file based on the proposal context.
     * Delegates content resolution to the injected tool.
     * @param {string} path
     * @param {ProposalContext} proposal The overall proposal context.
     * @returns {Promise<string|null>} The content string or null if not found.
     */
    public async getCurrentContent(path: string, proposal: ProposalContext): Promise<string | null> {
        return this.#contentResolver.resolveContent(path, proposal);
    }

    /**
     * Fetches content required for a policy evaluation against a specific context.
     * @param {ResolutionContext} context The context object provided by CIE (contains proposal details, filePath, scope).
     * @returns {Promise<{ content: string | null, exists: boolean }>} The artifact context.
     */
    public async resolveArtifactContext(context: ResolutionContext): Promise<{ content: string | null, exists: boolean }> {
        const path = context.filePath;

        if (!path) {
             return { content: null, exists: false };
        }
        
        // Default proposal details if missing
        const proposalDetails: ProposalContext = context.proposalDetails || {};
        
        const content = await this.getCurrentContent(path, proposalDetails);

        return {
            content: content,
            exists: content !== null
        };
    }
}