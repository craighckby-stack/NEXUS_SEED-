/**
 * Image Generation Skill
 * @description
 * Utilizes the z-ai-web-dev-sdk package to implement AI image generation capabilities.
 * This skill generates images from text descriptions, creates visual content, and designs assets
 * with AI-powered image creation. Supports multiple image sizes and returns base64 encoded images.
 *
 * @license MIT
 */

import { z } from 'zod';
import { Image, ImageSize } from './types/image';
import { ZAI } from 'z-ai-web-dev-sdk';
import { generateImage } from './generateImage';
import { generateImageBatch } from './generateImageBatch';
import { ImageGenerationService } from './ImageGenerationService';
import { buildEffectivePrompt } from './buildEffectivePrompt';
import { safeGenerateImage } from './safeGenerateImage';
import { selectOptimalSize } from './selectOptimalSize';

// Supported image sizes
const supportedSizes = [
  { value: '1024x1024', description: 'Square' },
  { value: '768x1344', description: 'Portrait' },
  { value: '864x1152', description: 'Portrait' },
  { value: '1344x768', description: 'Landscape' },
  { value: '1152x864', description: 'Landscape' },
  { value: '1440x720', description: 'Wide landscape' },
  { value: '720x1440', description: 'Tall portrait' }
];

// Image generation constants
const MAX_RETRIES = 3;
const DEFAULT_SIZE = '1024x1024';

// Types
type ImageGenerationOptions = {
  prompt: string;
  size?: ImageSize;
  outputPath?: string;
  retries?: number;
};

class ImageGenerationSkill {
  private zaiInstance: ZAI;

  constructor() {
    this.zaiInstance = new ZAI();
  }

  async generateImage({ prompt, size = DEFAULT_SIZE, outputPath = './image.png', retries = MAX_RETRIES }: ImageGenerationOptions) {
    try {
      const image = await this.zaiInstance.images.generations.create({
        prompt,
        size
      });

      const { data } = image;
      const buffer = Buffer.from(data[0].base64, 'base64');
      fs.writeFileSync(outputPath, buffer);

      return {
        success: true,
        path: outputPath,
        prompt,
        size,
        fileSize: buffer.length
      };
    } catch (error) {
      if (retries > 0) {
        return await safeGenerateImage(prompt, size, outputPath, retries);
      }

      return {
        success: false,
        error: error.message,
        prompt,
        size,
        retries
      };
    }
  }

  async generateImageBatch(prompts: string[], outputDir = './generated-images') {
    const results = await generateImageBatch(prompts, outputDir);

    return results;
  }

  selectOptimalSize(purpose: string): ImageSize | undefined {
    const sizeMap = {
      'hero-banner': supportedSizes[0].value,
      'blog-header': supportedSizes[1].value,
      'social-square': supportedSizes[0].value,
      'portrait': supportedSizes[1].value,
      'product': supportedSizes[0].value,
      'landscape': supportedSizes[3].value,
      'mobile-banner': supportedSizes[6].value,
      'thumbnail': supportedSizes[0].value
    };

    return supportedSizes.find(size => size.value === sizeMap[purpose]) || undefined;
  }
}

// Export functions
export {
  ImageGenerationSkill,
  generateImage,
  generateImageBatch,
  safeGenerateImage,
  selectOptimalSize,
  Image,
  ImageSize,
  buildEffectivePrompt
};