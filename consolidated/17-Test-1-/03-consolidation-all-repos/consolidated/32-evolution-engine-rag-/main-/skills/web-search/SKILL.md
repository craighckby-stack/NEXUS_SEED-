// Import the ZAI SDK
import ZAI from 'z-ai-web-dev-sdk';

// Initialize the ZAI instance
let zaiInstance;

// Initialize ZAI instance
async function initZAI() {
  zaiInstance = await ZAI.create();
}

// Define a function to perform a web search
async function searchWeb(query, num = 10) {
  try {
    // Check if ZAI instance is initialized
    if (!zaiInstance) {
      await initZAI();
    }

    // Perform the search
    const results = await zaiInstance.functions.invoke('web_search', {
      query: query,
      num: num
    });

    // Return the search results
    return results;
  } catch (error) {
    // Handle any errors that occur during the search
    console.error('Error performing search:', error);
    return [];
  }
}

// Define a function to get formatted search results
async function getFormattedResults(query, num = 10) {
  try {
    // Perform the search
    const results = await searchWeb(query, num);

    // Format the results for display
    const formatted = results.map((item, index) => ({
      position: index + 1,
      title: item.name,
      url: item.url,
      description: item.snippet,
      domain: item.host_name,
      publishDate: item.date
    }));

    // Return the formatted results
    return formatted;
  } catch (error) {
    // Handle any errors that occur during formatting
    console.error('Error formatting results:', error);
    return [];
  }
}

// Example usage
async function main() {
  // Perform a search
  const query = 'artificial intelligence';
  const numResults = 10;
  const results = await getFormattedResults(query, numResults);

  // Display the results
  console.log(`Search results for "${query}":`);
  results.forEach(result => {
    console.log(`${result.position}. ${result.title}`);
    console.log(`   ${result.url}`);
    console.log(`   ${result.description}`);
    console.log('');
  });
}

// Run the example
main();