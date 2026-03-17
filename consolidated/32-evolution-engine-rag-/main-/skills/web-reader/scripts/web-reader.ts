// SOURCE (skills/web-reader/scripts/web-reader.ts)

import ZAI from 'z-ai-web-dev-sdk';

/**
 * Interface representing the result of the page reader function.
 */
interface PageReaderFunctionResult {
  code: number;
  data: {
    html: string;
    publishedTime?: string;
    title: string;
    url: string;
    usage: {
      tokens: number;
    };
  };
  meta: {
    usage: {
      tokens: number;
    };
  };
  status: number;
}

/**
 * Invokes the page reader function and logs the result.
 * @param url The URL to be read.
 */
async function invokePageReader(url: string): Promise<PageReaderFunctionResult> {
  const zai = await ZAI.create();
  return zai.functions.invoke('page_reader', { url });
}

/**
 * Logs the result of the page reader function invocation.
 * @param result The result of the page reader function invocation.
 */
function logResult(result: PageReaderFunctionResult): void {
  console.log('Web reader invocation succeeded. Results:');
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handles errors that occur during the page reader function invocation.
 * @param error The error that occurred.
 */
function handleError(error: unknown): void {
  console.error('page_reader failed:', error instanceof Error ? error.message : error);
}

/**
 * Main function that invokes the page reader and logs the result.
 * @param url The URL to be read.
 */
async function main(url: string): Promise<void> {
  try {
    const result = await invokePageReader(url);
    logResult(result);
  } catch (error) {
    handleError(error);
  }
}

main('https://www.google.com');