import { IComplianceDataFetcher } from '../resolvers/PolicyAdherenceResolver';

/**
 * Minimal interface definition for the required kernel data fetching tool.
 */
interface IDataFetcherTool {
    execute(options: { baseUrl: string, endpoint: string }): Promise<number>;
}

/**
 * ComplianceAPIFetcher implements the IComplianceDataFetcher interface.
 * This service is responsible for handling network requests or system queries 
 * needed to retrieve raw compliance data, using Dependency Injection for the core fetcher logic.
 */
export class ComplianceAPIFetcher implements IComplianceDataFetcher {
    #apiBaseUrl: string;
    #dataFetcherTool: IDataFetcherTool; // The injected kernel tool

    /**
     * @param dataFetcherTool - The kernel plugin tool responsible for execution (e.g., AGI_PLUGINS.SimulatedDataFetcherTool).
     * @param baseUrl - The base URL for the compliance API.
     */
    constructor(
        dataFetcherTool: IDataFetcherTool,
        baseUrl: string = 'http://localhost:8080/compliance/'
    ) {
        this.#setupDependencies(dataFetcherTool, baseUrl);
    }

    /**
     * Extracts synchronous dependency resolution and initialization.
     */
    #setupDependencies(dataFetcherTool: IDataFetcherTool, baseUrl: string): void {
        this.#dataFetcherTool = dataFetcherTool;
        this.#apiBaseUrl = baseUrl;
    }

    /**
     * Isolates the interaction with the external IDataFetcherTool dependency.
     */
    async #delegateToDataFetchToolExecution(endpoint: string): Promise<number> {
        return this.#dataFetcherTool.execute({
            baseUrl: this.#apiBaseUrl,
            endpoint: endpoint
        });
    }

    /**
     * Fetches compliance metrics by delegating the request to the injected DataFetcherTool.
     * @param endpoint - The specific API path defined in the policy's audit_config.
     * @returns A promise resolving to the raw compliance data value.
     */
    public async fetchComplianceData(endpoint: string): Promise<number> {
        // Delegate URL construction and data retrieval to the injected tool via proxy.
        return this.#delegateToDataFetchToolExecution(endpoint);
    }
}