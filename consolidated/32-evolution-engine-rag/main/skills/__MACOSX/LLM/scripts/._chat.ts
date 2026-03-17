// skills/llm/scripts/chat.ts

/**
 * Initiates a chat session using the LLM chat factory.
 */

// Import required modules
import { createChat } from './chatFactory';
import { ChatInterface } from './chatInterface';

// Define the chat initializer function
async function initChatSession(): Promise<void> {
  try {
    // Create a new chat instance using the chat factory
    const chat: ChatInterface = createChat();

    // Start the chat session
    await chat.start();
  } catch (error: unknown) {
    // Log any errors that occur during chat initialization
    console.error('Chat initialization error:', error);
  }
}

// Initialize the chat session
initChatSession();