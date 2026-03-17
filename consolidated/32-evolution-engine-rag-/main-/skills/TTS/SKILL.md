// Refactored splitTextIntoChunks function
/**
 * Splits text into chunks suitable for TTS API calls (max length per chunk).
 * Attempts to split primarily on sentence boundaries (.!?).
 * @param {string} text - The text to split.
 * @param {number} [maxLength=1000] - The maximum length per chunk.
 * @returns {string[]} An array of text chunks.
 */
function splitTextIntoChunks(text, maxLength = 1000) {
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences = text.match(sentenceRegex) || [text];
  const chunks = [];

  let currentChunk = '';
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());

  return chunks.filter(Boolean);
}

// Refactored textToSpeech function
/**
 * Converts text to speech and saves it as a WAV file.
 * @param {string} text - The text to synthesize.
 * @param {string} outputPath - The path to save the audio file.
 * @returns {Promise<string>} The output path.
 */
async function textToSpeech(text, outputPath) {
  const zaiInstance = await importZaiInstance();
  const response = await zaiInstance.audio.tts.create({
    input: text,
    voice: 'tongtong',
    speed: 1.0,
    response_format: 'wav',
    stream: false,
  });

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(new Uint8Array(arrayBuffer));

  await writeFileSync(outputPath, buffer);

  console.log(`Audio saved to ${outputPath}`);
  return outputPath;
}

// Helper function to import and create zai instance
async function importZaiInstance() {
  const { default: zai } = await import('z-ai-web-dev-sdk');
  return await zai.create();
}

// Helper function to write file synchronously
async function writeFileSync(path, data) {
  const fsModule = await import('fs');
  return fsModule.writeFileSync(path, data);
}

// Refactored batchTextToSpeech function
/**
 * Processes an array of texts into separate audio files.
 * @param {string[]} textArray - The array of texts to synthesize.
 * @param {string} outputDir - The directory to save the audio files.
 * @returns {Promise<{ success: boolean; text: string; path?: string; error?: string }[]>} An array of results.
 */
async function batchTextToSpeech(textArray, outputDir) {
  const zaiInstance = await importZaiInstance();

  if (!(await dirExists(outputDir))) {
    await mkdir(outputDir, { recursive: true });
  }

  const generationPromises = textArray.map(async (text, index) => {
    const outputPath = `${outputDir}/audio_${index + 1}.wav`;

    if (text.length > 1024) {
      return { success: false, text, error: 'Input exceeds 1024 characters limit.' };
    }

    try {
      const response = await zaiInstance.audio.tts.create({
        input: text,
        voice: 'kazi',
        response_format: 'wav',
        stream: false,
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(new Uint8Array(arrayBuffer));

      await writeFileSync(outputPath, buffer);

      return { success: true, text, path: outputPath };
    } catch (error) {
      return { success: false, text, error: error.message };
    }
  });

  const results = await Promise.all(generationPromises);
  console.log(`Batch complete. Successes: ${results.filter((r) => r.success).length}`);
  return results;
}

// Helper function to check if directory exists
async function dirExists(path) {
  const fsModule = await import('fs');
  return fsModule.existsSync(path);
}

// Helper function to create directory
async function mkdir(path, options) {
  const fsModule = await import('fs');
  return fsModule.mkdirSync(path, options);
}

// Refactored TTSGenerator class
class TTSGenerator {
  #zai;

  async initialize() {
    if (!this.#zai) {
      this.#zai = await importZaiInstance();
    }
  }

  async generateAudio(text, options = {}) {
    if (!this.#zai) {
      throw new Error('TTSGenerator not initialized.');
    }

    const { voice = 'tongtong', speed = 1.0, format = 'wav' } = options;

    const response = await this.#zai.audio.tts.create({
      input: text,
      voice,
      speed,
      response_format: format,
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(new Uint8Array(arrayBuffer));
  }

  async saveAudio(text, outputPath, options = {}) {
    const buffer = await this.generateAudio(text, options);
    await writeFileSync(outputPath, buffer);
    return outputPath;
  }
}

// Refactored Next.js API route example
// In api/tts/route.ts or similar server-side file
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const zaiInstance = await importZaiInstance();

    const { text, voice = 'tongtong', speed = 1.0 } = await req.json();

    if (!text || text.length > 1024) {
      return NextResponse.json({ error: 'Invalid text input length.' }, { status: 400 });
    }

    const response = await zaiInstance.audio.tts.create({
      input: text.trim(),
      voice,
      speed,
      response_format: 'wav',
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'TTS generation failed.';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}