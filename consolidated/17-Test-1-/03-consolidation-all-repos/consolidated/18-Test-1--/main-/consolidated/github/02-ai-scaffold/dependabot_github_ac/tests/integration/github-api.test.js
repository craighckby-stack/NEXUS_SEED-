/**
 * Integration Tests for GitHub API
 */

describe('GitHub API Integration', () => {
    const token = process.env.GITHUB_TOKEN;

    beforeAll(() => {
        if (!token) {
            console.warn('GITHUB_TOKEN not set, skipping tests');
        }
    });

    test('should fetch repository info', async () => {
        if (!token) return;
        
        const response = await fetch(
            'https://api.github.com/repos/craighckby-stack/ai-scaffold',
            { headers: { 'Authorization': `token ${token}` } }
        );
        
        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.name).toBe('ai-scaffold');
    });

    test('should list repository files', async () => {
        if (!token) return;
        
        const response = await fetch(
            'https://api.github.com/repos/craighckby-stack/ai-scaffold/contents',
            { headers: { 'Authorization': `token ${token}` } }
        );
        
        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
    });
});
