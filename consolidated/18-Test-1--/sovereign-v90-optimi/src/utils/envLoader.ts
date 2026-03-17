import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

/**
 * loadEnvironment
 * Loads environment variables from .env files based on NODE_ENV.
 * Precedence: .env.<NODE_ENV> is loaded first, ensuring it takes precedence over .env
 * which is loaded subsequently only for variables not yet defined.
 */
export function loadEnvironment(): void {
    const cwd = process.cwd();
    const env = process.env.NODE_ENV || 'development';
    const messages: string[] = [];

    // 1. Load environment-specific .env file (Highest Precedence)
    const specificFilename = `.env.${env}`;
    const specificPath = path.resolve(cwd, specificFilename);
    
    if (fs.existsSync(specificPath)) {
        // dotenv.config() loads variables only if they are not already set in process.env
        dotenv.config({ path: specificPath });
        messages.push(`Loaded environment-specific configuration from ${specificFilename}`);
    }

    // 2. Load general .env file (Fallback Defaults)
    const generalPath = path.resolve(cwd, '.env');
    if (fs.existsSync(generalPath)) {
        // This ensures variables defined in .env only load if they weren't set by the specific file or system environment.
        dotenv.config({ path: generalPath });
        messages.push('Loaded general configuration from .env (as fallback)');
    }

    messages.forEach(msg => {
        console.log(`[Config Loader] ${msg}`);
    });
}