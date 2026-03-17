// Import required modules
import ZAI from 'z-ai-web-dev-sdk';
import express from 'express';

// Initialize Express app
const app = express();
app.use(express.json());

// State management using Map (replace with Redis or DB in production)
const conversations = new Map();
let zaiInstance;

// Initialize ZAI instance
async function initializeZAI() {
  zaiInstance = await ZAI.create();
}

// Define a class for managing conversations
class ConversationManager {
  #messages;
  #zai;

  /**
   * @param {string} systemPrompt - Initial system prompt for the conversation
   */
  constructor(systemPrompt = 'You are a helpful assistant.') {
    this.#messages = [{ role: 'assistant', content: systemPrompt }];
    this.#zai = null;
  }

  /**
   * Initialize the ZAI instance for the conversation manager
   */
  async initialize() {
    this.#zai = await ZAI.create();
  }

  /**
   * Send a message in the conversation and get the response
   * @param {string} userMessage - The message sent by the user
   * @returns {string} The response from the AI
   */
  async sendMessage(userMessage) {
    this.#messages.push({ role: 'user', content: userMessage });

    const completion = await this.#zai.chat.completions.create({
      messages: this.#messages,
      thinking: { type: 'disabled' }
    });

    const assistantResponse = completion.choices[0]?.message?.content;

    if (assistantResponse) {
      this.#messages.push({ role: 'assistant', content: assistantResponse });
    }

    return assistantResponse;
  }

  /**
   * Get the conversation history
   * @returns {object[]} The conversation history
   */
  getHistory() {
    return this.#messages;
  }

  /**
   * Clear the conversation history and set a new system prompt
   * @param {string} newSystemPrompt - The new system prompt
   */
  clearHistory(newSystemPrompt) {
    this.#messages = [
      { role: 'assistant', content: newSystemPrompt || this.#messages[0].content }
    ];
  }

  /**
   * Get the turn count in the conversation
   * @returns {number} The turn count
   */
  getTurnCount() {
    return Math.max(0, this.#messages.length - 1);
  }
}

// Define a class for generating content
class ContentGenerator {
  #zai;

  constructor() {
    this.#zai = null;
  }

  /**
   * Initialize the ZAI instance for the content generator
   */
  async initialize() {
    this.#zai = await ZAI.create();
  }

  /**
   * Generate a blog post on a given topic and tone
   * @param {string} topic - The topic of the blog post
   * @param {string} tone - The tone of the blog post (default: 'professional')
   * @returns {string} The generated blog post
   */
  async generateBlogPost(topic, tone = 'professional') {
    const completion = await this.#zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: `You are a professional content writer. Write in a ${tone} tone.` },
        { role: 'user', content: `Write a blog post about: ${topic}. Include intro, main points, and conclusion.` }
      ]
    });
    return completion.choices[0]?.message?.content;
  }
}

// Define a function for analyzing data
async function analyzeData(data, analysisType) {
  const zai = await ZAI.create();

  const prompts = {
    summarize: 'Summarize the key insights from the data.',
    recommendation: 'Provide actionable recommendations based on the data.'
  };

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: `You are a data analyst. ${prompts[analysisType]}` },
      { role: 'user', content: `Analyze this data:\n\n${JSON.stringify(data, null, 2)}` }
    ]
  });

  return completion.choices[0]?.message?.content;
}

// Define a function for getting structured responses
async function getStructuredResponse(query, format = 'json') {
  const zai = await ZAI.create();
  const formatInstructions = {
    json: 'Respond with valid JSON only. Do not include any surrounding text or markdown formatting.',
    list: 'Respond with a numbered list.'
  };

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'assistant',
        content: `You are a helpful assistant. ${formatInstructions[format] || ''}`
      },
      { role: 'user', content: query }
    ]
  });

  const rawResponse = completion.choices[0]?.message?.content;

  if (format === 'json') {
    try {
      return JSON.parse(rawResponse);
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      return { error: 'Parsing failure', raw: rawResponse };
    }
  }
  return rawResponse;
}

// Define API endpoint for chat
app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, message, systemPrompt = 'You are a helpful assistant.' } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Session ID and message are required' });
    }

    let history = conversations.get(sessionId) || [
      { role: 'assistant', content: systemPrompt }
    ];

    history.push({ role: 'user', content: message });

    const completion = await zaiInstance.chat.completions.create({
      messages: history,
      thinking: { type: 'disabled' }
    });

    const aiResponse = completion.choices[0]?.message?.content;

    history.push({ role: 'assistant', content: aiResponse });
    conversations.set(sessionId, history); // Update history

    res.json({
      success: true,
      response: aiResponse,
      turnCount: history.length - 1
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initialize ZAI instance and start server
initializeZAI().then(() => {
  app.listen(3000, () => {
    console.log('Chatbot API running on port 3000');
  });
});