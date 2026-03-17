// Import ZAI web dev SDK and use its type definitions
import { ZAI, FunctionResult } from 'z-ai-web-dev-sdk';

// Define the search result item interface
interface SearchItem extends FunctionResult {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
  date: string;
  favicon: string;
}

// Define the main function with improved type safety
async function main(query: string, num: number = 10): Promise<void> {
  try {
    // Create a new ZAI instance
    const zai = await ZAI.create();

    // Invoke the web search function with provided query and num
    const searchResult = await zai.functions.invoke('web_search', {
      query,
      num
    });

    // Verify if search result is an array
    if (Array.isArray(searchResult)) {
      // Log each search item with improved console logging
      console.log(`Search Results (top ${searchResult.length}):`);
      console.log('=============================');
      searchResult.forEach((item: SearchItem, index: number) => {
        console.log(`  ${index + 1}. ${item.name} (${item.rank})`);
        console.log(`    URL: ${item.url}`);
        console.log(`    Snippet: ${item.snippet}`);
        console.log(`    Host: ${item.host_name}`);
        console.log(`    Date: ${item.date}`);
        console.log(' ');
      });
      console.log();
      console.log(`Total results: ${searchResult.length}`);
    } else {
      // Log unexpected response format for debugging
      console.log('Unexpected response format:', searchResult);
    }
  } catch (err: any) {
    // Log error message for debugging
    console.error('Web search failed:', err?.message || err);
  }
}

// Call the main function with initial query
main('What is the capital of France?', 5);