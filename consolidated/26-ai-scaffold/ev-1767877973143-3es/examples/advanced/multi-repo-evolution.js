/**
 * Multi-Repository Evolution Example
 * Demonstrates how to evolve multiple repositories simultaneously 
 * with optimization focused on concurrency limits and robustness, 
 * preventing potential API rate limiting issues.
 */

const REPOSITORIES = [
    { owner: 'craighckby-stack', name: 'ai-scaffold' },
    { owner: 'example-user', name: 'optimization-target-1' },
    { owner: 'example-user', name: 'optimization-target-2' },
    { owner: 'example-user', name: 'optimization-target-3' },
    // Add more repositories here
];

// Optimization: Default limit for concurrent external API/Git operations
const DEFAULT_CONCURRENCY = 3; 

class MultiRepoEvolution {
    /**
     * @param {string} token GitHub Token
     * @param {string} apiKey Gemini/AI Key
     * @param {number} [maxConcurrency=DEFAULT_CONCURRENCY] Maximum number of repositories to evolve simultaneously
     */
    constructor(token, apiKey, maxConcurrency = DEFAULT_CONCURRENCY) {
        this.token = token;
        this.apiKey = apiKey;
        this.repositories = REPOSITORIES;
        this.maxConcurrency = maxConcurrency; // Configurable limit
    }

    /**
     * Starts the evolution process for all repositories with a concurrency throttle.
     * @returns {Promise<Array>} Array of results (fulfilled or rejected).
     */
    async evolveAll() {
        console.log(`Starting evolution for ${this.repositories.length} repositories with concurrency limit of ${this.maxConcurrency}.`);
        
        const promises = [];
        const runningPromises = [];

        for (const repo of this.repositories) {
            // 1. Define the evolution task
            const evolutionTask = this.evolveRepository(repo).finally(() => {
                // Optimization: Clean up the runningPromises array when the task settles
                const index = runningPromises.indexOf(evolutionTask);
                if (index > -1) runningPromises.splice(index, 1);
            });

            runningPromises.push(evolutionTask);
            promises.push(evolutionTask);
            
            // 2. Throttle: If we hit the concurrency limit, wait for the fastest task to finish
            if (runningPromises.length >= this.maxConcurrency) {
                await Promise.race(runningPromises);
            }
        }
        
        // 3. Wait for all remaining tasks to complete gracefully
        const finalResults = await Promise.allSettled(promises);

        return finalResults.map((result, index) => ({
            repo: this.repositories[index],
            status: result.status,
            // Provide detailed context for rejected promises
            value: result.status === 'fulfilled' ? result.value : result.reason.message || result.reason
        }));
    }

    /**
     * Simulates the evolution process for a single repository, including AI planning and git operations.
     */
    async evolveRepository(repo) {
        const startTime = Date.now();
        const repoId = `${repo.owner}/${repo.name}`;

        console.log(`[START] Evolving ${repoId}`);
        
        try {
            // Optimization: Simulate time taken for complex AI analysis and planning
            const analysisTime = Math.random() * 2000 + 500; 
            await new Promise(resolve => setTimeout(resolve, analysisTime));
            
            // Simulate potential failure condition (e.g., validation errors, merge conflict)
            if (Math.random() < 0.05) { 
                throw new Error("AI changes resulted in failing tests or merge conflict.");
            }

            const commits = Math.floor(Math.random() * 5) + 1;
            const duration_ms = Date.now() - startTime;
            
            console.log(`[SUCCESS] ${repoId}: Applied ${commits} commits in ${duration_ms}ms.`);

            // Optimization: Return specific metrics of the evolution effort
            return { 
                success: true, 
                commits: commits,
                duration_ms: duration_ms,
                optimized_files: Math.floor(Math.random() * 10) + 1 
            };
            
        } catch (error) {
            const duration_ms = Date.now() - startTime;
            console.error(`[FAIL] ${repoId}: Failed after ${duration_ms}ms. Reason: ${error.message}`);
            // Throw a standardized error object to be captured by allSettled
            throw new Error(`Evolution failed for ${repoId}. Details: ${error.message}`);
        }
    }
}

// Usage example:
/*
// Setting concurrency to 2 to ensure slow, controlled processing
const evolution = new MultiRepoEvolution('GITHUB_TOKEN', 'GEMINI_KEY', 2); 
const results = await evolution.evolveAll();
console.log('\n--- Final Evolution Results ---');
results.forEach(res => {
    console.log(`[${res.status.toUpperCase()}] ${res.repo.owner}/${res.repo.name}:`, 
        res.status === 'fulfilled' ? res.value : res.value);
});
*/