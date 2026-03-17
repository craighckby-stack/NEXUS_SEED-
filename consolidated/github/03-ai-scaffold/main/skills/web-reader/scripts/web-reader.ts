import { Logger } from 'z-ai-web-dev-sdk';
import chalk from 'chalk';
import console from 'console';

type PageReaderFunctionResult = {
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
};

/**
 * Executes the page reader function with the provided URL, logs the result, and handles errors.
 * @param url The URL to read.
 */
async function main(url: string): Promise<void> {
  try {
    const { code, data, meta, status } = await ZAI.create().functions.invoke('page_reader', { url });

    Logger.success(`Web reader invocation succeeded. Status: ${status}`);
    Logger.info(`Results:`);
    console.log(JSON.stringify({ code, data, meta, status }, null, 2));
  } catch (err) {
    Logger.error(`page_reader failed: ${err?.message || err}`);
  }
}

main('https://www.google.com');
```

**