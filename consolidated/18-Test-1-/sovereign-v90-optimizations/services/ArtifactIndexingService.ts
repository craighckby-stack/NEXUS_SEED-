import { IndexingPolicy } from '../config/schemas/ArtifactIndexingPolicy.json';
import { FileWatcher } from '../core/FileSystemWatcher';
import { VectorDB } from '../data/VectorDatabase';

// Interface definitions (kept for context)
interface PathPolicyRuleMatcherTool {
    execute(args: { path: string, rules: IndexingPolicy['policies'] }): IndexingPolicy['policies'][number] | null;
}

interface ArtifactIndexingPolicyManagerTool {
    getPolicy(): IndexingPolicy;
    getRules(): IndexingPolicy['policies'];
    getDefaultPolicy(): string;
}

// Utility for internal error handling
class KernelSetupError extends Error {
    constructor(message: string) {
        super(`[ArtifactIndexingKernel Setup Error] ${message}`);
        this.name = 'KernelSetupError';
    }
}

/**
 * ArtifactIndexingKernel
 * Handles filesystem event watching and routing based on defined indexing policies.
 * Adheres to Kernel architectural standards by isolating state, setup, and I/O.
 */
export class ArtifactIndexingKernel {
    #policyManager: ArtifactIndexingPolicyManagerTool;
    #watcher: FileWatcher;
    #vectorDb: VectorDB;
    #ruleMatcher: PathPolicyRuleMatcherTool;

    // Optimization: Cache static policy data for high-frequency access
    #cachedRules: IndexingPolicy['policies'];
    #cachedDefaultPolicy: string;

    /**
     * @param policyConfig The indexing policy configuration.
     * @param vectorDb The vector database instance.
     * @param ruleMatcherTool The tool for matching paths against policy rules.
     * @param FileWatcherClass The constructor for the FileWatcher utility.
     * @param PolicyManagerClass The constructor for the ArtifactIndexingPolicyManager tool.
     */
    constructor(
        policyConfig: IndexingPolicy,
        vectorDb: VectorDB,
        ruleMatcherTool: PathPolicyRuleMatcherTool,
        FileWatcherClass: new () => FileWatcher,
        PolicyManagerClass: new (config: IndexingPolicy) => ArtifactIndexingPolicyManagerTool
    ) {
        this.#setupDependencies(
            policyConfig,
            vectorDb,
            ruleMatcherTool,
            FileWatcherClass,
            PolicyManagerClass
        );
    }

    // STRATEGIC GOAL 2: Synchronous Setup Extraction
    #setupDependencies(
        policyConfig: IndexingPolicy,
        vectorDb: VectorDB,
        ruleMatcherTool: PathPolicyRuleMatcherTool,
        FileWatcherClass: new () => FileWatcher,
        PolicyManagerClass: new (config: IndexingPolicy) => ArtifactIndexingPolicyManagerTool
    ): void {
        if (!policyConfig || !vectorDb || !ruleMatcherTool || !FileWatcherClass || !PolicyManagerClass) {
            this.#throwSetupError("Missing required configuration, database, or dependency classes.");
        }

        // Initialize Policy Manager (abstraction of policy configuration/sorting)
        this.#policyManager = new PolicyManagerClass(policyConfig);

        // Optimization: Cache static policy data immediately after manager initialization
        this.#cachedRules = this.#policyManager.getRules();
        this.#cachedDefaultPolicy = this.#policyManager.getDefaultPolicy();

        // Assign remaining dependencies
        this.#vectorDb = vectorDb;
        this.#ruleMatcher = ruleMatcherTool;

        // Initialize File Watcher
        this.#watcher = new FileWatcherClass();
    }
    
    // I/O Proxy for Setup Errors
    #throwSetupError(message: string): never {
        throw new KernelSetupError(message);
    }

    public startIndexing(): void {
        const policy = this.#delegateToPolicyManagerGetPolicy();
        this.#logStartMessage(policy.version);

        this.#startWatcher((path: string, event: 'added' | 'changed' | 'deleted') => {
            this.#handleArtifactChange(path, event);
        });
    }

    // STRATEGIC GOAL 3: I/O Proxy Methods

    // I/O Proxy for Watcher Initialization
    #startWatcher(callback: (path: string, event: 'added' | 'changed' | 'deleted') => void): void {
        // Watches the current working directory
        this.#watcher.watch('.', callback);
    }

    // I/O Proxy for Policy Access
    #delegateToPolicyManagerGetPolicy(): IndexingPolicy {
        return this.#policyManager.getPolicy();
    }

    // I/O Proxy for External Tool Execution (Rule Matcher)
    #delegateToRuleMatcher(path: string, rules: IndexingPolicy['policies']): IndexingPolicy['policies'][number] | null {
        return this.#ruleMatcher.execute({ path, rules });
    }

    // I/O Proxy for core asynchronous work (processing)
    private async #delegateToProcessingAndIndexing(job: { path: string, rule: any, event: string }) {
        this.#logProcessingStart(job.path, job.rule.strategy);
        
        // Implementation details involving #vectorDb interaction go here
        // e.g. await this.#vectorDb.insert(processedData);
    }

    // I/O Proxy for Logging Start
    #logStartMessage(version: string): void {
        console.log(`[IndexingService] Starting watch on artifacts based on v${version} policy.`);
    }

    // I/O Proxy for Logging Default Match
    #logDefaultPolicyMatch(path: string, defaultPolicy: string): void {
        console.log(`[Indexing] Path ${path} matches default policy: ${defaultPolicy}`);
    }

    // I/O Proxy for Logging Ignore Rule
    #logIgnoreRule(path: string, rule: IndexingPolicy['policies'][number]): void {
        console.log(`[Indexing] Ignoring artifact: ${path} via priority ${rule.priority}`);
    }
    
    // I/O Proxy for Logging Processing Start
    #logProcessingStart(path: string, strategy: string): void {
        console.log(`[Indexing] Processing ${path} using strategy ${strategy}.`);
    }

    private async #handleArtifactChange(path: string, event: 'added' | 'changed' | 'deleted') {
        
        // 1. Find the applicable rule using the dedicated tool and cached rules
        const applicableRule = this.#delegateToRuleMatcher(
            path,
            this.#cachedRules // Optimized: Use cached rules
        );
        
        if (!applicableRule) {
            // Optimized: Use cached default policy
            this.#logDefaultPolicyMatch(path, this.#cachedDefaultPolicy);
            return;
        }

        if (applicableRule.strategy === 'IGNORE') {
            this.#logIgnoreRule(path, applicableRule);
            return;
        }

        // 2. Delegate to processing pipeline
        await this.#delegateToProcessingAndIndexing({ path, rule: applicableRule, event });
    }
}