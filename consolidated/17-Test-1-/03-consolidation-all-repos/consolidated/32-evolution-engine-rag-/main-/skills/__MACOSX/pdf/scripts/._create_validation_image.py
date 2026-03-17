// skills/pdf/scripts/create_validation_image.js

/**
 * Module for creating validation images.
 */

import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { createRequire } from 'module';
import { createCanvas, loadImage } from 'canvas';
import { createLogger } from './logger.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = createLogger(__filename);

/**
 * Creates a validation image with the given code.
 *
 * @param {string} image_path - Path to save the validation image.
 * @param {string} validation_code - Validation code to display on the image.
 */
async function createValidationImage(imagePath, validationCode) {
  try {
    const canvas = createCanvas(200, 100);
    const ctx = canvas.getContext('2d');
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';
    ctx.fillText(validationCode, 100, 50);
    const pngStream = canvas.createPNGStream();
    const fs = await import('fs/promises');
    await fs.writeFile(imagePath, pngStream);
    logger.info(`Validation image created at ${imagePath} with code ${validationCode}`);
  } catch (error) {
    logger.error(`Failed to create validation image: ${error.message}`);
  }
}

/**
 * Main entry point for the script.
 */
async function main() {
  const imagePath = join(__dirname, 'validation_image.png');
  const validationCode = '123456';
  await createValidationImage(imagePath, validationCode);
}

if (import.meta.main) {
  main();
}

// logger.js
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console()
  ]
});

export { logger as createLogger };