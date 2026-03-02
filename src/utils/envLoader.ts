import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

/**
 * loadEnvironment
 * Scans for .env files (.env.development, .env, etc.) and loads them into process.env.
 * This ensures that ConfigurationService can correctly access environment variables 
 * during local development before they are potentially injected by a runtime environment.
 * 
 * NOTE: This utility assumes 'dotenv' is a dependency for production standard use.
 */
export function loadEnvironment(): void {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const specificEnvPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);
    const defaultEnvPath = path.resolve(process.cwd(), '.env');

    let loaded = false;

    // 1. Load environment-specific file (e.g., .env.test)
    if (fs.existsSync(specificEnvPath)) {
        dotenv.config({ path: specificEnvPath });
        console.log(`[Config Loader] Loaded environment variables from: ${specificEnvPath}`);
        loaded = true;
    }

    // 2. Load general .env file (if not already loaded via specific path and if it exists)
    if (!loaded && fs.existsSync(defaultEnvPath)) {
        dotenv.config({ path: defaultEnvPath });
        console.log(`[Config Loader] Loaded environment variables from: ${defaultEnvPath}`);
        loaded = true;
    }
    
    if (!loaded && nodeEnv !== 'production') {
        console.warn("[Config Loader] No .env file found. Relying solely on shell environment variables or defaults.");
    }
}
