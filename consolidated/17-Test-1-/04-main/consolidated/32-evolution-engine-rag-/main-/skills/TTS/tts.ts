import ZAI from "z-ai-web-dev-sdk";
import { promises as fs } from "fs";
import path from "path";

/**
 * Options for text-to-speech synthesis.
 */
interface TTSOptions {
  /**
   * The text to synthesize.
   */
  text: string;
  /**
   * The output file path.
   */
  outputFilePath: string;
  /**
   * The voice to use (optional, defaults to "tongtong").
   */
  voice?: string;
  /**
   * The speech speed (optional, defaults to 1.0).
   */
  speechSpeed?: number;
}

/**
 * Generates text-to-speech audio using the ZAI SDK and saves it to a file.
 *
 * @param options The options for text-to-speech synthesis.
 * @returns A promise that resolves when the TTS audio has been saved.
 */
async function generateTTSAndSave(options: TTSOptions): Promise<void> {
  const { text, outputFilePath, voice = "tongtong", speechSpeed = 1.0 } = options;

  if (!text || !outputFilePath) {
    throw new Error("Text and output file path must be provided.");
  }

  try {
    const zaiInstance = await createZAIInstance();
    const ttsResponse = await createTTSResponse(zaiInstance, text, voice, speechSpeed);
    const audioBuffer = await getAudioBuffer(ttsResponse);
    await saveAudioToFile(outputFilePath, audioBuffer);
    console.log(`TTS audio successfully saved to ${outputFilePath}`);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`TTS generation failed for text: "${text.substring(0, 30)}..." -> ${errorMessage}`);
    // Re-throw or handle based on application needs, keeping it simple for this example
  }
}

/**
 * Creates a new ZAI instance.
 *
 * @returns A promise that resolves with the ZAI instance.
 */
async function createZAIInstance(): Promise<any> {
  return ZAI.create();
}

/**
 * Creates a TTS response using the ZAI instance.
 *
 * @param zaiInstance The ZAI instance.
 * @param text The text to synthesize.
 * @param voice The voice to use.
 * @param speechSpeed The speech speed.
 * @returns A promise that resolves with the TTS response.
 */
async function createTTSResponse(
  zaiInstance: any,
  text: string,
  voice: string,
  speechSpeed: number
): Promise<any> {
  return zaiInstance.audio.tts.create({
    input: text,
    voice,
    speed: speechSpeed,
    response_format: "wav", // Ensure consistent output format
    stream: false, // Requesting the full response at once
  });
}

/**
 * Gets the audio buffer from the TTS response.
 *
 * @param ttsResponse The TTS response.
 * @returns A promise that resolves with the audio buffer.
 */
async function getAudioBuffer(ttsResponse: any): Promise<Buffer> {
  const arrayBuffer = await ttsResponse.arrayBuffer();
  return Buffer.from(new Uint8Array(arrayBuffer));
}

/**
 * Saves the audio buffer to a file.
 *
 * @param outputFilePath The output file path.
 * @param audioBuffer The audio buffer.
 * @returns A promise that resolves when the file has been saved.
 */
async function saveAudioToFile(outputFilePath: string, audioBuffer: Buffer): Promise<void> {
  await ensureOutputDirectoryExists(outputFilePath);
  await fs.writeFile(outputFilePath, audioBuffer);
}

/**
 * Ensures the output directory exists.
 *
 * @param outputFilePath The output file path.
 * @returns A promise that resolves when the directory has been created.
 */
async function ensureOutputDirectoryExists(outputFilePath: string): Promise<void> {
  const outputDir = path.dirname(outputFilePath);
  if (outputDir && outputDir !== '.') {
    await fs.mkdir(outputDir, { recursive: true });
  }
}

/**
 * Gets the error message from the error object.
 *
 * @param error The error object.
 * @returns The error message.
 */
function getErrorMessage(error: any): string {
  return error instanceof Error ? error.message : String(error);
}

// Example Usage:
const DEFAULT_TEXT = "Hello, world! This is an optimized TTS call.";
const DEFAULT_OUTPUT_FILE = path.join(process.cwd(), "output.wav");

generateTTSAndSave({ text: DEFAULT_TEXT, outputFilePath: DEFAULT_OUTPUT_FILE });