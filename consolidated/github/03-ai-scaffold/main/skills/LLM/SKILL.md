/**
 * @fileoverview Large Language Model (LLM) Skill implementation.
 * @author [Your Name]
 */

import { ZAI } from 'z-ai-web-dev-sdk';
import { ConversationManager } from './conversation-manager';
import { ContentGenerator } from './content-generator';
import { CodeAssistant } from './code-assistant';

/**
 * Creates a new Large Language Model (LLM) instance.
 * @returns {Promise<ZAI>} The initialized ZAI instance.
 */
async function createZAIInstance() {
  return ZAI.create();
}

/**
 * Initializes a reusable ZAI instance for performance.
 * @returns {Promise<ZAI>} The initialized ZAI instance.
 */
async function initZAI() {
  const zai = await createZAIInstance();
  return zai;
}

/**
 * Manages conversation history and context.
 * @class
 */
class ConversationManager {
  constructor(systemPrompt = 'You are a helpful assistant.') {
    this.systemPrompt = systemPrompt;
    this.messages = [];
    this.zai = null;
    this.clearHistory(systemPrompt);
  }

  /**
   * Initializes the conversation manager instance.
   * @async
   */
  async initialize() {
    if (!this.zai) {
      this.zai = await initZAI();
    }
  }

  /**
   * Sends a message to the LLM.
   * @param {string} userMessage The user's message.
   * @returns {Promise<string>} The AI's response.
   */
  async sendMessage(userMessage) {
    if (!this.zai) throw new Error('ConversationManager not initialized. Call initialize() first.');
    
    // Add user message to history
    this.messages.push({
      role: 'user',
      content: userMessage
    });

    // Get completion
    const completion = await this.zai.chat.completions.create({
      messages: this.messages,
      thinking: { type: 'disabled' }
    });

    const assistantResponse = completion.choices[0]?.message?.content;

    // Add assistant response to history
    this.messages.push({
      role: 'assistant',
      content: assistantResponse
    });

    return assistantResponse;
  }

  /**
   * Gets the conversation history.
   * @returns {Array<{role: string, content: string}>} The conversation history.
   */
  getHistory() {
    // Exclude the initial system prompt (index 0) from the visible history
    return this.messages.slice(1); 
  }

  /**
   * Clears the conversation history.
   * @param {string} [systemPrompt] The system prompt to initialize the history with.
   */
  clearHistory(systemPrompt = this.systemPrompt) {
    this.messages = [
      {
        role: 'assistant',
        content: systemPrompt
      }
    ];
  }

  /**
   * Gets the number of messages in the conversation.
   * @returns {number} The number of messages.
   */
  getMessageCount() {
    // Subtract 1 for the persistent system message
    return this.messages.length - 1;
  }
}

/**
 * Generates content using the LLM.
 * @class
 */
class ContentGenerator {
  constructor() {
    this.zai = null;
  }

  /**
   * Initializes the content generator instance.
   * @async
   */
  async initialize() {
    this.zai = await initZAI();
  }

  /**
   * Generates content based on a prompt.
   * @param {string} systemRole The system role.
   * @param {string} userPrompt The user prompt.
   * @returns {Promise<string>} The generated content.
   */
  async generate(systemRole, userPrompt) {
    if (!this.zai) throw new Error('Generator not initialized. Call initialize() first.');

    const completion = await this.zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemRole },
        { role: 'user', content: userPrompt }
      ],
      thinking: { type: 'disabled' }
    });
    return completion.choices[0]?.message?.content;
  }

  /**
   * Generates a blog post based on a topic and tone.
   * @param {string} topic The topic.
   * @param {string} [tone='professional'] The tone.
   * @returns {Promise<string>} The generated blog post.
   */
  async generateBlogPost(topic, tone = 'professional') {
    return this.generate(
      `You are a professional content writer. Write in a ${tone} tone.`,
      `Write a detailed blog post about: ${topic}. Include an introduction, main points, and conclusion.`
    );
  }

  /**
   * Generates a product description based on a product name and features.
   * @param {string} productName The product name.
   * @param {Array<string>} features The product features.
   * @returns {Promise<string>} The generated product description.
   */
  async generateProductDescription(productName, features) {
    return this.generate(
      'You are an expert at writing compelling product descriptions for e-commerce.',
      `Write a product description for "${productName}". Key features: ${features.join(', ')}.`
    );
  }
}

/**
 * Assists with code generation and debugging.
 * @class
 */
class CodeAssistant {
  constructor() {
    this.zai = null;
  }

  /**
   * Initializes the code assistant instance.
   * @async
   */
  async initialize() {
    this.zai = await initZAI();
  }

  /**
   * Generates code based on a description and language.
   * @param {string} description The code description.
   * @param {string} language The programming language.
   * @returns {Promise<string>} The generated code.
   */
  async generateCode(description, language) {
    if (!this.zai) throw new Error('CodeAssistant not initialized.');

    return this.zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are an expert ${language} programmer. Write clean, efficient, and well-commented code.`
        },
        {
          role: 'user',
          content: `Write ${language} code to: ${description}`
        }
      ],
      thinking: { type: 'disabled' }
    }).then(c => c.choices[0]?.message?.content);
  }

  /**
   * Debugs code based on a code snippet and issue.
   * @param {string} code The code snippet.
   * @param {string} issue The debugging issue.
   * @returns {Promise<string>} The debugging suggestions.
   */
  async debugCode(code, issue) {
    if (!this.zai) throw new Error('CodeAssistant not initialized.');

    return this.zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'You are an expert debugger. Identify bugs and suggest fixes.'
        },
        {
          role: 'user',
          content: `Code:\n${code}\n\nIssue: ${issue}\n\nFind the bug and suggest a fix.`
        }
      ],
      thinking: { type: 'disabled' }
    }).then(c => c.choices[0]?.message?.content);
  }
}

// Performance & Security Summary
// | Aspect | Tip | Rationale |
// | :--- | :--- | :--- |
// | **Performance** | **Reuse SDK Instance**: Create `ZAI.create()` once at startup. | Avoids unnecessary initialization overhead and connection establishment per request. |
// | **Performance** | **Context Trimming**: Limit `messages` array size. | Reduces API latency and avoids token limits/high costs. |
// | **Performance** | **Specific Prompts**: Use clear, concise system prompts. | Improves model efficiency and response quality. |
// | **Reliability** | **Error Handling**: Implement retry logic with exponential backoff. | Gracefully handles transient network or rate-limiting errors. |
// | **Security** | **Backend Only**: Never expose `z-ai-web-dev-sdk` client-side. | Protects API keys and backend infrastructure. |
// | **Security** | **Input Validation**: Sanitize all user messages. | Mitigates prompt injection and abuse. |

//