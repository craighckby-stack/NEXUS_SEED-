import ZAI from 'z-ai-web-dev-sdk';

/**
 * Represents a single search result item.
 */
interface SearchResultItem {
  url: string;
  name: string;
  snippet: string;
  hostName: string;
  rank: number;
  date: string;
  favicon: string;
}

/**
 * Performs a web search using the provided query and returns the results.
 * 
 * @param query The search query.
 * @param num The number of results to return (default: 10).
 */
async function performWebSearch(query: string, num: number = 10): Promise<SearchResultItem[]> {
  try {
    const zai = await ZAI.create();
    const searchResult = await zai.functions.invoke('web_search', { query, num });
    return Array.isArray(searchResult) ? searchResult : [];
  } catch (error: any) {
    console.error('Web search failed:', error?.message || error);
    return [];
  }
}

/**
 * Prints the search results to the console.
 * 
 * @param results The search results.
 */
function printSearchResults(results: SearchResultItem[]): void {
  console.log('Search Results:');
  console.log('================\n');

  results.forEach((item, index) => {
    console.log(`${index + 1}. ${item.name}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   Snippet: ${item.snippet}`);
    console.log(`   Host: ${item.hostName}`);
    console.log(`   Date: ${item.date}`);
    console.log('');
  });

  console.log(`\nTotal results: ${results.length}`);
}

/**
 * Main function to initiate the web search.
 * 
 * @param query The search query.
 * @param num The number of results to return (default: 5).
 */
async function main(query: string, num: number = 5): Promise<void> {
  const results = await performWebSearch(query, num);
  printSearchResults(results);
}

main('What is the capital of France?');