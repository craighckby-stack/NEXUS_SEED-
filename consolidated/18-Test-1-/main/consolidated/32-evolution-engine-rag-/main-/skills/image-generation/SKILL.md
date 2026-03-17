// Import required modules
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Define constants
const SUPPORTED_SIZES = [
  '1024x1024',  // Square
  '768x1344',   // Portrait
  '864x1152',   // Portrait
  '1344x768',   // Landscape
  '1152x864',   // Landscape
  '1440x720',   // Wide landscape
  '720x1440'    // Tall portrait
];

// Define a function to generate an image
async function generateImage(prompt, size, outputPath) {
  // Check if the size is supported
  if (!SUPPORTED_SIZES.includes(size)) {
    throw new Error(`Unsupported size: ${size}. Use one of: ${SUPPORTED_SIZES.join(', ')}`);
  }

  // Create a ZAI instance
  const zai = await ZAI.create();

  // Generate the image
  const response = await zai.images.generations.create({
    prompt: prompt,
    size: size
  });

  // Get the base64 encoded image
  const imageBase64 = response.data[0].base64;

  // Decode the base64 image and save it to the output path
  const buffer = Buffer.from(imageBase64, 'base64');
  fs.writeFileSync(outputPath, buffer);

  // Return the output path
  return outputPath;
}

// Define a function to generate an image with caching
class ImageGenerationService {
  constructor(outputDir = './generated-images') {
    this.outputDir = outputDir;
    this.zai = null;
    this.cache = new Map();
  }

  async initialize() {
    this.zai = await ZAI.create();
    
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  generateCacheKey(prompt, size) {
    return crypto
      .createHash('md5')
      .update(`${prompt}-${size}`)
      .digest('hex');
  }

  async generate(prompt, options = {}) {
    const {
      size = '1024x1024',
      useCache = true,
      filename = null
    } = options;

    // Check cache
    const cacheKey = this.generateCacheKey(prompt, size);
    
    if (useCache && this.cache.has(cacheKey)) {
      const cachedPath = this.cache.get(cacheKey);
      if (fs.existsSync(cachedPath)) {
        return {
          path: cachedPath,
          cached: true,
          prompt: prompt,
          size: size
        };
      }
    }

    // Generate new image
    const response = await this.zai.images.generations.create({
      prompt: prompt,
      size: size
    });

    const imageBase64 = response.data[0].base64;
    const buffer = Buffer.from(imageBase64, 'base64');

    // Determine output path
    const outputFilename = filename || `${cacheKey}.png`;
    const outputPath = path.join(this.outputDir, outputFilename);

    fs.writeFileSync(outputPath, buffer);

    // Cache result
    if (useCache) {
      this.cache.set(cacheKey, outputPath);
    }

    return {
      path: outputPath,
      cached: false,
      prompt: prompt,
      size: size,
      fileSize: buffer.length
    };
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheSize() {
    return this.cache.size;
  }
}

// Define a function to build an effective prompt
function buildEffectivePrompt(subject, style, details = []) {
  const components = [
    subject,
    style,
    ...details,
    'high quality',
    'detailed'
  ];

  return components.filter(Boolean).join(', ');
}

// Define a function to select the optimal size
function selectOptimalSize(purpose) {
  const sizeMap = {
    'hero-banner': '1440x720',
    'blog-header': '1344x768',
    'social-square': '1024x1024',
    'portrait': '768x1344',
    'product': '1024x1024',
    'landscape': '1344x768',
    'mobile-banner': '720x1440',
    'thumbnail': '1024x1024'
  };

  return sizeMap[purpose] || '1024x1024';
}

// Define a function to safely generate an image with retries
async function safeGenerateImage(prompt, size, outputPath, retries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const zai = await ZAI.create();

      const response = await zai.images.generations.create({
        prompt: prompt,
        size: size
      });

      if (!response.data || !response.data[0] || !response.data[0].base64) {
        throw new Error('Invalid response from image generation API');
      }

      const imageBase64 = response.data[0].base64;
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(outputPath, buffer);

      return {
        success: true,
        path: outputPath,
        attempts: attempt
      };
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);

      if (attempt < retries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  return {
    success: false,
    error: lastError.message,
    attempts: retries
  };
}

// Define an Express.js API endpoint
import express from 'express';

const app = express();
app.use(express.json());
app.use('/images', express.static('generated-images'));

let zaiInstance;
const outputDir = './generated-images';

async function initZAI() {
  zaiInstance = await ZAI.create();
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, size = '1024x1024' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await zaiInstance.images.generations.create({
      prompt: prompt,
      size: size
    });

    const imageBase64 = response.data[0].base64;
    const buffer = Buffer.from(imageBase64, 'base64');
    
    const filename = `img_${Date.now()}.png`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, buffer);

    res.json({
      success: true,
      imageUrl: `/images/${filename}`,
      prompt: prompt,
      size: size
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

initZAI().then(() => {
  app.listen(3000, () => {
    console.log('Image generation API running on port 3000');
  });
});