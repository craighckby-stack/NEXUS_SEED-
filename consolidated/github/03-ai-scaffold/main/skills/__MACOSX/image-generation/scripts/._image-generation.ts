// @flow

/**
 * Scripts for image generation tasks.
 */

import * as fs from 'fs';
import * as path from 'path';

// Define constants for image generation
const IMAGE_FORMAT = {
  Jpeg: 'jpeg',
  Png: 'png',
  Webp: 'webp',
};

const SIZES = {
  Small: 200,
  Medium: 400,
  Large: 800,
};

// Define type aliases for clarity
type ImageFormat = keyof typeof IMAGE_FORMAT;
type ImageSize = keyof typeof SIZES;

// Function to generate images
async function generateImage({
  inputFilePath,
  outputDirectory,
  format = IMAGE_FORMAT.Jpeg,
  size = ImageSize.Small,
}: {
  inputFilePath: string;
  outputDirectory: string;
  format?: ImageFormat;
  size?: ImageSize;
}): Promise<void> {
  const inputBuffer = fs.readFileSync(inputFilePath);
  const outputFilePath = path.join(outputDirectory, `image.${IMAGE_FORMAT[format]}`);
  fs.writeFileSync(outputFilePath, inputBuffer);

  // Example code: Image optimization (not implemented)
  // const optimizedBuffer = await optimizeImage(inputBuffer, format, size);
  // fs.writeFileSync(outputFilePath, optimizedBuffer);
}

// Mocked image optimization function
async function optimizeImage(imageBuffer: Buffer, format: ImageFormat, size: ImageSize): Promise<Buffer> {
  // TO DO: implement image optimization logic
  return imageBuffer;
}

// Example usage
async function main() {
  const inputFilePath = './input-image.jpg';
  const outputDirectory = './output-images';
  await generateImage({ inputFilePath, outputDirectory, format: IMAGE_FORMAT.Jpeg, size: SIZES.Large });
}

main();
```

**