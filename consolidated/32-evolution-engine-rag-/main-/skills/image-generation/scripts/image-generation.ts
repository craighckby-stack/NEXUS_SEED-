// SOURCE (skills/image-generation/scripts/image-generation.ts)

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs/promises';
import { console } from 'console';

// Define image sizes as an enum for better type safety
enum ImageSize {
  SMALL = '768x1344',
  MEDIUM = '1024x1024',
  LARGE = '1344x768',
  EXTRA_LARGE = '1440x720',
  PORTRAIT = '720x1440',
  LANDSCAPE = '864x1152',
  SQUARE = '1152x864',
}

// Define a function to generate an image
async function generateImage(prompt: string, size: ImageSize, outFile: string): Promise<void> {
  try {
    // Create a new ZAI instance
    const zai = await ZAI.create();

    // Generate the image using the ZAI API
    const response = await zai.images.generations.create({
      prompt,
      size,
    });

    // Extract the base64 encoded image data from the response
    const base64 = response?.data?.[0]?.base64;

    // Check if image data was returned
    if (!base64) {
      console.error('No image data returned by the API');
      console.log('Full response:', JSON.stringify(response, null, 2));
      return;
    }

    // Convert the base64 encoded image data to a buffer
    const buffer = Buffer.from(base64, 'base64');

    // Write the image buffer to the output file
    await fs.writeFile(outFile, buffer);
    console.log(`Image saved to ${outFile}`);
  } catch (error: any) {
    console.error('Image generation failed:', error?.message || error);
  }
}

// Example usage
generateImage('A cute kitten', ImageSize.MEDIUM, './output.png');