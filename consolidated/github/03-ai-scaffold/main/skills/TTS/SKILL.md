import { Buffer } from 'buffer'; // Required for Node environments
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import clsx from 'clsx';
import console from 'console';

/**
 * Splits text into chunks based on sentence boundaries, respecting a maximum length.
 * @param {string} text - The input text.
 * @param {number} maxLength - Max length for each chunk (default 1020, slightly below API limit).
 * @returns {string[]} An array of text chunks.
 */
function splitTextIntoChunks(text, maxLength = 1020) {
  const chunks = [];
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text]; 
  
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
  
  return chunks;
}

/**
 * Converts a standard Web Response object (containing audio data) to a Node Buffer.
 * @param {Response} response - The response object from zai.audio.tts.create.
 * @returns {Promise<Buffer>} The audio data as a Node Buffer.
 */
async function responseToBuffer(response) {
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(new Uint8Array(arrayBuffer));
}

// Define a singleton pattern outside the handler for optimal performance
let zaiInstance = null;

async function getZAIInstance() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

/**
 * Generates audio from text and saves it locally.
 * @param {string} text - The text to synthesize.
 * @param {string} outputPath - Path to save the resulting audio file.
 * @returns {Promise<string>} The path of the saved file.
 */
async function textToSpeech(text, outputPath) {
  const zai = await getZAIInstance();

  const response = await zai.audio.tts.create({
    input: text,
    voice: 'tongtong',
    speed: 1.0,
    response_format: 'wav',
    stream: false
  });

  const buffer = await responseToBuffer(response); 
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Audio saved to ${outputPath}`);
  return outputPath;
}

/**
 * Cleans text for better TTS pronunciation (e.g., handles common abbreviations).
 */
function prepareTextForTTS(text) {
  text = text.replace(/\s+/g, ' ').trim();
  const abbreviations = { 'Dr.': 'Doctor', 'Mr.': 'Mister', 'Mrs.': 'Misses' };
  for (const [abbr, full] of Object.entries(abbreviations)) {
    text = text.replace(new RegExp(abbr, 'g'), full);
  }
  return text;
}

async function safeTTS(text, outputPath, options = {}) {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text input cannot be empty');
    }
    if (text.length > 1024) {
      throw new Error('Text input exceeds maximum length (1024 characters). Use chunking utility.');
    }
    
    const processedText = prepareTextForTTS(text);
    const zai = await getZAIInstance(); 
    
    const params = {
      input: processedText,
      voice: options.voice || 'tongtong',
      speed: options.speed || 1.0,
      response_format: options.format || 'wav',
      stream: options.stream || false
    };

    const response = await zai.audio.tts.create(params);

    const buffer = await responseToBuffer(response);
    fs.writeFileSync(outputPath, buffer);

    return { success: true, path: outputPath, size: buffer.length };

  } catch (error) {
    console.error(`TTS Error for '${text.substring(0, 50)}...':`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generates audio for long text by splitting it and processing chunks sequentially.
 * @param {string} longText - The full text to synthesize.
 * @param {string} outputDir - Directory to save sequential chunks.
 */
async function generateLongText(longText, outputDir) {
  const zai = await getZAIInstance();
  const chunks = splitTextIntoChunks(longText); // Use utility defined earlier
  const results = [];

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let i = 0; i < chunks.length; i++) {
    const text = chunks[i];
    const outputPath = path.join(outputDir, `part_${i + 1}.wav`);

    try {
      const response = await zai.audio.tts.create({
        input: text,
        voice: 'tongtong',
        response_format: 'wav',
        stream: false
      });

      const buffer = await responseToBuffer(response);
      fs.writeFileSync(outputPath, buffer);
      results.push(outputPath);

    } catch (error) {
      console.error(`Chunk ${i + 1} failed:`, error.message);
    }
  }
  return results;
}

export default async function (req, res) {
  try {
    const { text, voice = 'tongtong', speed = 1.0, format = 'wav' } = await req.json();

    if (!text || text.length > 1024) {
      return res.status(400).json({ error: 'Invalid text input (0 < length <= 1024)' });
    }
    
    const zai = await getZAIInstance();

    const response = await zai.audio.tts.create({
      input: text.trim(),
      voice,
      speed,
      response_format: format,
      stream: false, // Generally prefer non-streaming for standard HTTP responses
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    return res
      .status(200)
      .header('Content-Type', `audio/${format === 'pcm' ? 'pcm' : format}`)
      .header('Content-Length', buffer.length.toString())
      .header('Cache-Control', 'no-cache')
      .send(buffer);

  } catch (error) {
    console.error('TTS API Error:', error);
    return res.status(500).json({ error: 'Audio generation failed.' });
  }
}