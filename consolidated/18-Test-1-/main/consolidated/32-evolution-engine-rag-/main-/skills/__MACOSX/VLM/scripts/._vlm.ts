// skills/vlm/scripts/vlm.ts

/**
 * Configuration interface for VLM API client.
 */
interface VLMConfig {
  /**
   * Base URL for VLM API.
   */
  readonly baseUrl: string;

  /**
   * API token for authentication.
   */
  readonly token: string;

  /**
   * Timeout in milliseconds for API requests.
   */
  readonly timeout: number;
}

/**
 * VLM API client class.
 */
class VLMClient {
  private readonly #config: VLMConfig;

  /**
   * Constructs a new VLM API client instance with the given configuration.
   * @param config - The configuration for the VLM API client.
   */
  constructor(config: VLMConfig) {
    this.#config = config;
  }

  /**
   * Makes a GET request to the VLM API.
   * @param endpoint - The endpoint to make the request to.
   * @returns A promise resolving to the response data.
   */
  async fetch(endpoint: string): Promise<any> {
    const url = `${this.#config.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.#config.token}`,
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        timeout: this.#config.timeout,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  }
}

// Example usage:
const vlmConfig: VLMConfig = {
  baseUrl: 'https://example.com/api/',
  token: 'your-api-token',
  timeout: 5000,
};

const vlmClient = new VLMClient(vlmConfig);
vlmClient.fetch('users')
  .then((data) => console.log(data))
  .catch((error) => console.error(error));