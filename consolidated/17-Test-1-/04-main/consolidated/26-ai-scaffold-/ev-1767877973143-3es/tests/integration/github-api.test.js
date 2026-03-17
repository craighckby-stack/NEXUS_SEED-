/**
 * Integration Tests for GitHub API
 */

// Optimization: Define constants for cleaner code and less repetitive string construction
const GITHUB_API_BASE_URL = 'https://api.github.com';
const REPOSITORY_FULL_NAME = 'craighckby-stack/ai-scaffold';
const REPOSITORY_NAME = 'ai-scaffold';
const REPO_PATH = `/repos/${REPOSITORY_FULL_NAME}`;

describe('GitHub API Integration', () => {
    const token = process.env.GITHUB_TOKEN;
    let authorizedFetch;

    beforeAll(() => {
        if (!token) {
            console.warn('GITHUB_TOKEN not set, skipping tests');
        }

        // Optimization: Define a reusable fetch helper function once
        authorizedFetch = (path) => {
            if (!token) {
                // Prevent unauthorized calls if the token check inside the test fails somehow
                throw new Error("Cannot execute fetch without GITHUB_TOKEN.");
            }
            return fetch(
                `${GITHUB_API_BASE_URL}${path}`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        // Optimization: Explicitly set the Accept header for consistency and API speed
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
        };
    });

    test('should fetch repository info', async () => {
        if (!token) return;
        
        // Optimization: Use the centralized authorizedFetch helper and predefined paths
        const response = await authorizedFetch(REPO_PATH);
        
        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.name).toBe(REPOSITORY_NAME);
    });

    test('should list repository files', async () => {
        if (!token) return;
        
        // Optimization: Use the centralized authorizedFetch helper and predefined paths
        const response = await authorizedFetch(`${REPO_PATH}/contents`);
        
        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
        // Optimization: Add an assertion to ensure meaningful data was returned
        expect(data.length).toBeGreaterThan(0);
    });
});