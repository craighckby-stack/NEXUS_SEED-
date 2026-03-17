import ZAI from 'z-ai-web-dev-sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exit } from 'process';

/**
 * Configuration for the ZAI ASR service.
 */
interface AsrConfig {
  fileBase64: string;
}

/**
 * Result of the ASR transcription.
 */
interface AsrResult {
  text?: string;
}

/**
 * Application configuration.
 */
interface AppConfig {
  inputFile: string;
}

/**
 * Initializes application configuration from command line arguments.
 * @param argv Command line arguments.
 * @returns Application configuration.
 */
function initializeAppConfig(argv: string[]): AppConfig {
  const DEFAULT_INPUT_FILE = './output.wav';
  return { inputFile: argv[2] ?? DEFAULT_INPUT_FILE };
}

/**
 * Validates the existence of the input audio file.
 * @param inputFile Path to the audio file to validate.
 */
async function validateInputFile(inputFile: string): Promise<void> {
  try {
    await fs.access(inputFile);
  } catch (error) {
    console.error(`Error: Audio file not found at "${inputFile}"`);
    exit(1);
  }
}

/**
 * Initializes the ZAI client with default configuration.
 */
async function initializeZaiClient(): Promise<ZAI> {
  return await ZAI.create();
}

/**
 * Reads the contents of the audio file.
 * @param inputFile Path to the audio file to read.
 */
async function readAudioFile(inputFile: string): Promise<Buffer> {
  return await fs.readFile(inputFile);
}

/**
 * Transcribes an audio file using the ZAI ASR service.
 * @param inputFile Path to the audio file to transcribe.
 */
async function transcribeAudio(inputFile: string): Promise<void> {
  try {
    await validateInputFile(inputFile);
    const zai = await initializeZaiClient();
    const audioBuffer = await readAudioFile(inputFile);
    const fileBase64 = audioBuffer.toString('base64');
    const asrConfig: AsrConfig = { fileBase64 };

    console.log(`Transcribing audio file: ${path.basename(inputFile)}...`);

    const result = await zai.audio.asr.create(asrConfig);

    console.log('\n--- Transcription Result ---');
    printTranscriptionResult(result);
    console.log('----------------------------\n');
  } catch (error: unknown) {
    handleTranscriptionError(error);
  }
}

/**
 * Prints the result of the ASR transcription.
 * @param result The result of the ASR transcription.
 */
function printTranscriptionResult(result: AsrResult): void {
  console.log(result.text ?? JSON.stringify(result, null, 2));
}

/**
 * Handles errors that occur during ASR transcription.
 * @param error The error that occurred.
 */
function handleTranscriptionError(error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`ASR Transcription Failed: ${errorMessage}`);
  exit(1);
}

// --- Execution ---

const appConfig = initializeAppConfig(process.argv);
transcribeAudio(appConfig.inputFile);