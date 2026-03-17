// web-search.ts
/**
 * Web Search Script
 * 
 * This script handles web searches.
 */

// Import required modules
import { fetch } from 'node-fetch';
import { console } from 'console';

// Define constants
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36';
const SEARCH_ENGINE_URL = 'https://www.google.com/search';

// Define the search function
async function search(query: string): Promise<string> {
    // Create a new URL object
    const url = new URL(SEARCH_ENGINE_URL);
    
    // Set the query parameter
    url.searchParams.set('q', query);
    
    // Set the user agent
    const headers = {
        'User-Agent': USER_AGENT,
    };
    
    try {
        // Fetch the search results
        const response = await fetch(url.toString(), { headers });
        
        // Check if the response was successful
        if (!response.ok) {
            throw new Error(`Failed to fetch search results: ${response.status} ${response.statusText}`);
        }
        
        // Return the search results
        return await response.text();
    } catch (error) {
        // Log any errors
        console.error(`Error searching for '${query}': ${error.message}`);
        
        // Rethrow the error
        throw error;
    }
}

// Export the search function
export { search };