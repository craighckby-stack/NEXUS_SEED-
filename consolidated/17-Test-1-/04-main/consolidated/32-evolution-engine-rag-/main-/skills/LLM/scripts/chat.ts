// Import required modules and types from the ZAI SDK
import ZAI, { ChatMessage, ChatCompletionOptions } from "z-ai-web-dev-sdk";

/**
 * Represents a chat interaction with the ZAI client.
 */
class ZaiChat {
  #zaiClient: Awaited<ReturnType<typeof ZAI.create>>;

  /**
   * Initializes the ZAI client.
   */
  async init(): Promise<void> {
    this.#zaiClient = await ZAI.create();
  }

  /**
   * Creates initial chat messages.
   *
   * @param prompt The user's input prompt.
   * @returns The initial chat messages.
   */
  #createInitialMessages(prompt: string): ChatMessage[] {
    return [
      {
        role: "assistant",
        content: "Hi, I'm a helpful assistant.",
      },
      {
        role: "user",
        content: prompt,
      },
    ];
  }

  /**
   * Configures chat completion options.
   *
   * @param messages The chat messages.
   * @returns The chat completion options.
   */
  #configureChatOptions(messages: ChatMessage[]): ChatCompletionOptions {
    return {
      messages,
      stream: false,
      thinking: { type: "disabled" },
    };
  }

  /**
   * Sends a chat message and logs the response or an error.
   *
   * @param prompt The user's input prompt.
   */
  async sendMessage(prompt: string): Promise<void> {
    if (!prompt) {
      throw new Error("Prompt cannot be empty.");
    }

    try {
      const initialMessages = this.#createInitialMessages(prompt);
      const options = this.#configureChatOptions(initialMessages);

      const response = await this.#zaiClient.chat.completions.create(options);

      const replyContent = response.choices?.[0]?.message?.content;

      console.log("Chat reply:");
      if (replyContent) {
        console.log(replyContent);
      } else {
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Chat failed: ${errorMessage}`);
    }
  }
}

// Example usage
async function main(): Promise<void> {
  const chat = new ZaiChat();
  await chat.init();
  await chat.sendMessage("What is the capital of France?");
}

main();