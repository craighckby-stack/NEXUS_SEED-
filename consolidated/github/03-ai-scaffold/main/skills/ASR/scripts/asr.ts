// Import essential packages and initialize constants
import { create } from 'z-ai-web-dev-sdk';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { EOL } from 'os';
import { console as nodeConsole, exit } from 'process';

const EXIT_FAILURE = 1;
const ASR_MODEL = 'glm-4-flash';

/**
 * Performs Automatic Speech Recognition (ASR) on a local audio file specified via command line arguments using the ZAI SDK.
 */
async function main(): Promise<void> {
    const inputPathSegment = process.argv[2] ?? '';

    // 1. Argument Validation
    if (!inputPathSegment) {
        nodeConsole.error(chalk.red(`ERROR: Input audio file path required.`));
        nodeConsole.log(`Usage: node ${path.basename(process.argv[1])} <path/to/audio.wav>`);
        exit(EXIT_FAILURE);
    }

    const absoluteInputPath = path.resolve(inputPathSegment);

    try {
        // 2. File Validation and Loading
        const fileExistsOrExit = async (filePath: string): Promise<void> => {
            if (!fs.existsSync(filePath)) {
                throw new Error(`Audio file not found: ${filePath}`);
            }
        };
        await fileExistsOrExit(absoluteInputPath);

        nodeConsole.log(`Reading and submitting file: ${absoluteInputPath}`);

        // Load file synchronously and encode to base64.
        const fileBase64 = await readFileBase64(absoluteInputPath);

        // 3. SDK Initialization
        const zai = await create();

        // 4. Perform ASR
        const result = await zai.audio.asr.create({ fileBase64, model: ASR_MODEL });

        // 5. Output Processing
        const transcription = result.text?.trim();

        nodeConsole.log(EOL + `--- ASR Transcription Result ---${EOL}`);
        if (transcription) {
            nodeConsole.log(transcription);
        } else {
            nodeConsole.log('No transcription text received.');
            processSuccessStatus(result);
        }
    } catch (error: any) {
        // 6. Centralized Error Handling
        nodeConsole.error('\nFATAL ASR FAILURE:' + EOL);
        const errorMessage = error.message;
        nodeConsole.error(`Error: ${errorMessage}`);
        exit(EXIT_FAILURE);
    }
}

// Utility functions
async function readFileBase64(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, { encoding: 'base64' });
}

function processSuccessStatus(result: any): void {
    if (result.status && result.status !== 200) {
        nodeConsole.error(`API Status Error: ${result.status}.`);
    }
}

// Entry point
main();
```

**