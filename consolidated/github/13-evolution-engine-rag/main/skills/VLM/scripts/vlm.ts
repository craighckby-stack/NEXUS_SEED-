import ZAI, { VisionMessage, ChatCompletionContentPart } from 'z-ai-web-dev-sdk';

/**
 * Input structure for the VLM processing function.
 */
interface VLMInput {
  imageUrl: string;
  prompt: string;
}

/**
 * Configuration constants.
 */
const CONFIG = {
  MODEL_NAME: 'glm-4.6v',
  THINKING_CONFIG: { type: 'disabled' } as const,
};

/**
 * Initializes the ZAI client and creates a chat completion request using a Vision model.
 *
 * @param input - Input containing the image URL and prompt.
 */
async function processImageWithVLM(input: VLMInput): Promise<void> {
  try {
    const zaiClient = await ZAI.create();
    const messages = [
      createSystemMessage(),
      createUserMessage(input),
    ];

    const response = await zaiClient.chat.completions.createVision({
      model: CONFIG.MODEL_NAME,
      messages,
      thinking: CONFIG.THINKING_CONFIG,
    });

    const replyContent = getReplyContent(response);
    console.log('Vision model reply:');
    console.log(replyContent ?? JSON.stringify(response, null, 2));
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('Vision chat failed:', errorMessage);
  }
}

/**
 * Creates a system message to enforce plain text output.
 *
 * @returns The system message.
 */
function createSystemMessage(): VisionMessage {
  return {
    role: 'assistant',
    content: [{ type: 'text', text: 'Output only text, no markdown.' }],
  };
}

/**
 * Creates a user message containing the prompt and the image reference.
 *
 * @param input - Input containing the image URL and prompt.
 * @returns The user message.
 */
function createUserMessage(input: VLMInput): VisionMessage {
  return {
    role: 'user',
    content: [
      { type: 'text', text: input.prompt },
      { type: 'image_url', image_url: { url: input.imageUrl } } as ChatCompletionContentPart,
    ],
  };
}

/**
 * Safely extracts the reply content from the response.
 *
 * @param response - Response from the ZAI client.
 * @returns The reply content or null if not found.
 */
function getReplyContent(response: any): string | null {
  return response.choices?.[0]?.message?.content?.[0]?.text ?? null;
}

/**
 * Gets the error message from the error object.
 *
 * @param error - Error object.
 * @returns The error message.
 */
function getErrorMessage(error: any): string {
  return error instanceof Error ? error.message : String(error);
}

// Example execution
const exampleInput: VLMInput = {
  imageUrl: 'https://cdn.bigmodel.cn/static/logo/register.png',
  prompt: 'Please describe this image.',
};

processImageWithVLM(exampleInput);