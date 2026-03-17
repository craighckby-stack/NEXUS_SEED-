// Refactored Skill Reference

# VLM (Vision Chat) Skill Reference

This skill documents the implementation of vision capabilities using the z-ai-web-dev-sdk, enabling AI models to process and respond to images combined with text prompts.

## Skill Location

**Path**: `{project_path}/skills/VLM`

Reference scripts for testing are located in the `skills/VLM/scripts/` directory (e.g., `skills/VLM/scripts/vlm.ts`).

## Overview

Vision Chat allows you to build applications that analyze visual content, extract information, and answer questions about images via natural language conversation.

**IMPORTANT**: The `z-ai-web-dev-sdk` MUST be used in backend (server-side) code only. Never expose it in client-side code.

## Prerequisites

The `z-ai-web-dev-sdk` package is already installed. Import it as shown in the examples below.

## CLI Usage (Simple Tasks)

For rapid prototyping, quick analysis, or scripting, use the `z-ai CLI`.

### Basic Analysis

```bash
# Describe an image from URL
z-ai vision --prompt "What is the main subject?" --image "https://example.com/photo.jpg"

# Analyze a local file
z-ai vision -p "Count the people and describe their activities" -i "./crowd.jpg"
```

### Advanced Tasks

```bash
# Compare multiple images with Chain-of-Thought reasoning
z-ai vision \
  -p "Compare these two photos" \
  -i "./photo1.jpg" \
  -i "./photo2.jpg" \
  --thinking

# Stream output to console
z-ai vision -p "Describe this image in detail" -i "./photo.jpg" --stream
```

### CLI Parameters Summary

| Parameter | Alias | Required | Description |
| :--- | :--- | :--- | :--- |
| `--prompt` | `-p` | **Yes** | The conversational prompt or instruction. |
| `--image` | `-i` | Optional | Image URL or local file path. Use multiple times for multimodal input. |
| `--thinking` | `-t` | Optional | Enable Chain-of-Thought (CoT) reasoning for complex tasks. |
| `--output` | `-o` | Optional | Output file path (JSON format). |
| `--stream` | | Optional | Stream the response in real-time. |

### When to Use CLI vs SDK

| Use Case | Recommended Tool |
| :--- | :--- |
| Quick descriptions or testing | CLI |
| Simple automation scripts | CLI |
| Dynamic analysis in production APIs | SDK (with cached instance) |
| Multi-turn conversations with history | SDK |
| Custom processing and batch logic | SDK |

---

## Supported Media Content Types

The Vision Chat API supports combining text prompts with various media types within the content array structure:

### 1. `image_url` (Images)
Supports PNG, JPEG, GIF, WebP, etc. Use this for URLs or base64 data URIs.
```typescript
{ type: 'image_url', image_url: { url: imageUrlOrDataUri } }
```

### 2. `video_url` (Videos)
Supports MP4, AVI, MOV, etc.
```typescript
{ type: 'video_url', video_url: { url: videoUrl } }
```

### 3. `file_url` (Documents)
Supports PDF, DOCX, TXT, etc.
```typescript
{ type: 'file_url', file_url: { url: fileUrl } }
```

**Note**: A single user message can contain a mix of text, multiple images, videos, and documents.

## SDK Implementation

### Single Image Analysis (URL)

```javascript
import { ZAI } from 'z-ai-web-dev-sdk';

/**
 * Analyzes a single image URL based on a specific question.
 * @param {string} imageUrl The public URL of the image.
 * @param {string} question The prompt for the model.
 */
async function analyzeImage(imageUrl, question) {
  const zai = await ZAI.create();

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: question },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ],
    // Recommended to disable 'thinking' unless complex CoT reasoning is required
    thinking: { type: 'disabled' }
  });

  return response.choices[0]?.message?.content;
}
```

### Multiple Images Comparison

```javascript
import { ZAI } from 'z-ai-web-dev-sdk';

/**
 * Compares multiple images based on a user prompt.
 * @param {string[]} imageUrls Array of image URLs.
 * @param {string} question Comparison prompt.
 */
async function compareImages(imageUrls, question) {
  const zai = await ZAI.create();

  const content = [
    { type: 'text', text: question },
    ...imageUrls.map(url => ({
      type: 'image_url',
      image_url: { url }
    }))
  ];

  const response = await zai.chat.completions.createVision({
    messages: [{ role: 'user', content }],
    thinking: { type: 'disabled' }
  });

  return response.choices[0]?.message?.content;
}
```

### Base64 Image Upload (Recommended for Local Files)

Using base64 encoding ensures data is sent directly to the model without external fetching dependencies.

```javascript
import { ZAI } from 'z-ai-web-dev-sdk';
import fs from 'fs'; 

/**
 * Analyzes a local image file by encoding it as a base64 data URI.
 */
async function analyzeLocalImage(imagePath, question) {
  const zai = await ZAI.create();

  // Read file and encode
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  
  // Note: Production code should use robust MIME detection logic
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const dataUri = `data:${mimeType};base64,${base64Image}`;

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: question },
          { type: 'image_url', image_url: { url: dataUri } } // Pass data URI here
        ]
      }
    ],
    thinking: { type: 'disabled' }
  });

  return response.choices[0]?.message?.content;
}
```

## Advanced Use Cases

### Conversational Session Management

Maintaining chat history (`this.messages`) allows the AI to retain visual context across multiple turns.

```javascript
import { ZAI } from 'z-ai-web-dev-sdk';

class VisionChatSession {
  constructor() {
    this.messages = [];
    this.zai = null;
  }

  async initialize() {
    this.zai = await ZAI.create();
  }

  async processRequest() {
    if (!this.zai) throw new Error("Session not initialized. Call initialize() first.");
    
    const response = await this.zai.chat.completions.createVision({
      messages: this.messages,
      thinking: { type: 'disabled' }
    });

    const assistantMessage = response.choices[0]?.message?.content;
    
    // Store assistant response for history context
    this.messages.push({ role: 'assistant', content: assistantMessage });

    return assistantMessage;
  }
  
  /** Adds an image and an initial question to the session history. */
  async addImage(imageUrl, initialQuestion) {
    const content = [
      { type: 'text', text: initialQuestion },
      { type: 'image_url', image_url: { url: imageUrl } }
    ];
    this.messages.push({ role: 'user', content });
    return this.processRequest();
  }

  /** Adds a follow-up text question to the session history. */
  async followUp(question) {
    this.messages.push({
      role: 'user',
      content: [{ type: 'text', text: question }]
    });
    return this.processRequest();
  }
}
```

### Image Classification and Structured Tagging (JSON Output)

Prompting the model to return structured JSON data for easy programmatic consumption.

```javascript
import { ZAI } from 'z-ai-web-dev-sdk';

async function classifyImage(imageUrl) {
  const zai = await ZAI.create();

  const prompt = `Analyze this image and provide: 1. Main category 2. Key objects detected 3. Scene description 4. Suggested tags (comma-separated). Format your response strictly as a JSON object.`;

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ],
    thinking: { type: 'disabled' }
  });

  const content = response.choices[0]?.message?.content;
  
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse JSON response. Raw output:", content);
    return null;
  }
}
```

### OCR and Text Extraction

```javascript
import { ZAI } from 'z-ai-web-dev-sdk';

async function extractText(imageUrl) {
  const zai = await ZAI.create();

  const prompt = 'Extract all text from this image. Preserve the original layout and formatting as much as possible.';

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ],
    thinking: { type: 'disabled' }
  });

  return response.choices[0]?.message?.content;
}
```

## Best Practices

### 1. Prompt Engineering
- **Specificity:** Be explicit about the required output format (e.g., "List", "Compare", "Format as valid JSON").
- **Context:** Provide necessary domain context (e.g., "This is a blueprint", "This is historical data").

### 2. Performance
- **Caching SDK:** Initialize and cache the `ZAI` instance globally in server applications (see Express example below). Do not call `ZAI.create()` on every request.
- **Data Transfer:** Use base64 encoding for local files or critical data streams for reliability and speed, avoiding reliance on external URL fetching.

### 3. Error Handling Example

```javascript
async function safeVisionChat(imageUrl, question) {
  try {
    const zai = await ZAI.create();
    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: question },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ]
    });

    return { success: true, content: response.choices[0]?.message?.content };
  } catch (error) {
    // Log detailed error and return a safe, generic message to the client
    console.error('Vision API Request Failed:', error.message);
    return { success: false, error: 'Failed to process image request.' };
  }
}
```

### 4. Security
- Validate and sanitize all user-provided data (URLs, base64 strings).
- **NEVER** expose the `z-ai-web-dev-sdk` or related credentials to the client side.

## Integration Example: Express.js API (Recommended)

This pattern demonstrates optimal server-side initialization by caching the SDK instance globally.

```javascript
import express from 'express';
import { ZAI } from 'z-ai-web-dev-sdk';

const app = express();
app.use(express.json());

// Global variable to hold the initialized SDK instance
let zaiInstance;

// Initialize SDK once on startup
async function initZAI() {
  try {
    zaiInstance = await ZAI.create();
    console.log('ZAI SDK successfully initialized.');
  } catch (err) {
    console.error('FATAL: Failed to initialize ZAI SDK:', err);
    process.exit(1);
  }
}

app.post('/api/analyze-image', async (req, res) => {
  if (!zaiInstance) {
    return res.status(503).json({ error: 'Server initialization pending.' });
  }

  const { imageUrl, question } = req.body;

  if (!imageUrl || !question) {
    return res.status(400).json({ error: 'imageUrl and question are required parameters.' });
  }

  try {
    const response = await zaiInstance.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: question },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      thinking: { type: 'disabled' }
    });

    res.json({
      success: true,
      analysis: response.choices[0]?.message?.content
    });

  } catch (error) {
    console.error('API Error during vision request:', error.message);
    res.status(500).json({ success: false, error: 'Internal Server Error.' });
  }
});

initZAI().then(() => {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Vision chat API running on port ${PORT}`);
  });
});
```

**