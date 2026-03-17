// Import required modules
import ZAI from 'z-ai-web-dev-sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import express, { Request, Response } from 'express';

// Define constants and interfaces
const PROJECT_PATH = '{project_path}';
const SKILL_LOCATION = `${PROJECT_PATH}/skills/VLM`;
const LICENSE = 'MIT';

interface VisionChatRequest {
  imageUrl: string;
  question: string;
}

interface VisionChatResponse {
  success: boolean;
  analysis?: string;
  error?: string;
}

// Initialize Express app
const app = express();
app.use(express.json({ limit: '10mb' }));

// Initialize ZAI instance
let zaiInstance: ZAI | null = null;

// Function to initialize ZAI instance
async function initializeZAI(): Promise<void> {
  zaiInstance = await ZAI.create();
}

// Define API endpoint for vision chat
app.post('/api/vision', async (req: Request, res: Response) => {
  if (!zaiInstance) {
    return res.status(503).json({ error: 'Service not ready.' });
  }

  const { imageUrl, question } = req.body as VisionChatRequest;

  if (!imageUrl || !question) {
    return res.status(400).json({ error: 'Missing required fields: imageUrl and question.' });
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
  } catch (error: any) {
    console.error('Vision API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Vision processing failed.'
    });
  }
});

// Start Express app
initializeZAI().then(() => {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`VLM API running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to initialize ZAI SDK:", err);
});

// Define function to analyze local image
async function analyzeLocalImage(imagePath: string, question: string): Promise<string | undefined> {
  const zai = await ZAI.create();

  const imageBuffer = await fs.readFile(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const ext = path.extname(imagePath).toLowerCase();
  let mimeType: string;

  switch (ext) {
    case '.png':
      mimeType = 'image/png';
      break;
    case '.jpeg':
    case '.jpg':
      mimeType = 'image/jpeg';
      break;
    default:
      throw new Error(`Unsupported image format: ${ext}`);
  }

  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: question },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }
    ],
    thinking: { type: 'disabled' }
  });

  return response.choices[0]?.message?.content;
}

// Define function to compare multiple images
async function compareImages(imageUrls: string[], question: string): Promise<string | undefined> {
  const zai = await ZAI.create();

  const contentParts = [
    { type: 'text', text: question },
    ...imageUrls.map(url => ({
      type: 'image_url',
      image_url: { url }
    }))
  ];

  const response = await zai.chat.completions.createVision({
    messages: [{ role: 'user', content: contentParts }],
    thinking: { type: 'disabled' }
  });

  return response.choices[0]?.message?.content;
}

// Define class for conversational vision chat session management
class VisionChatSession {
  private messages: any[] = [];
  private zai: ZAI | undefined;

  async initialize(): Promise<void> {
    this.zai = await ZAI.create();
  }

  async addImage(imageUrl: string, initialQuestion: string): Promise<string | undefined> {
    if (!this.zai) throw new Error("Session not initialized.");

    this.messages.push({
      role: 'user',
      content: [
        { type: 'text', text: initialQuestion },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    });

    return this.getResponse();
  }

  async followUp(question: string): Promise<string | undefined> {
    if (!this.zai) throw new Error("Session not initialized.");

    this.messages.push({
      role: 'user',
      content: [{ type: 'text', text: question }]
    });

    return this.getResponse();
  }

  private async getResponse(): Promise<string | undefined> {
    if (!this.zai) throw new Error("Session not initialized.");

    const response = await this.zai.chat.completions.createVision({
      messages: this.messages,
      thinking: { type: 'disabled' }
    });

    const assistantMessage = response.choices[0]?.message?.content;

    // Maintain history for context
    if (assistantMessage) {
      this.messages.push({
        role: 'assistant',
        content: assistantMessage
      });
    }

    return assistantMessage;
  }
}