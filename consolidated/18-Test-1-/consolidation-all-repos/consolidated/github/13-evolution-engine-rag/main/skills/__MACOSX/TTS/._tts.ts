// skills/tts/tts.ts

/**
 * Text-to-Speech (TTS) module.
 * @module tts
 */

import { fileURLToPath } from 'url';
import { join } from 'path';
import https from 'https';
import fs from 'fs/promises';
import console from 'console';

// Define constants
const TTS_API_URL = 'https://claude.ai/api/organizations/';
const CONVERSATION_ID = '9671d65f-ae02-4464-bbd1-3649146c66b7';
const OUTPUT_DIR = '/mnt/user-data/outputs/TTS/scripts';

// Define the TTS class
class TextToSpeech {
  #organizationId: string;
  #conversationId: string;
  #outputFilePath: string;

  /**
   * Initialize the TextToSpeech instance.
   * @param {string} organizationId - The organization ID.
   * @param {string} conversationId - The conversation ID.
   * @param {string} outputFilePath - The output file path.
   */
  constructor(organizationId: string, conversationId: string, outputFilePath: string) {
    this.#organizationId = organizationId;
    this.#conversationId = conversationId;
    this.#outputFilePath = outputFilePath;
  }

  /**
   * Download the TTS file.
   * @param {string} url - The URL to download from.
   * @returns {Promise<void>}
   */
  async #downloadFile(url: string): Promise<void> {
    try {
      const response = await https.get(url);
      const fileStream = await fs.open(this.#outputFilePath, 'w');
      response.pipe(fileStream.createWriteStream());
      await new Promise((resolve, reject) => {
        fileStream.createWriteStream().on('finish', resolve);
        fileStream.createWriteStream().on('error', reject);
      });
      await fileStream.close();
    } catch (error) {
      throw error;
    }
  }

  async download(): Promise<void> {
    const url = `${TTS_API_URL}${this.#organizationId}/conversations/${this.#conversationId}/wiggle/download-file?path=${this.#outputFilePath}`;
    await this.#downloadFile(url);
  }
}

// Create a new TextToSpeech instance and download the file
const tts = new TextToSpeech(
  '646bcdf2-2de6-4395-8ef5-efda92eddefa',
  CONVERSATION_ID,
  join(OUTPUT_DIR, 'tts.ts')
);
tts.download().catch((error) => {
  console.error(error);
});