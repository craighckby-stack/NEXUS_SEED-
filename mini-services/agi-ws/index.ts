/**
 * AGI WebSocket Service
 * Real-time communication - AGI initiates conversation and asks questions
 */

import { Server } from 'socket.io';
import { createServer } from 'http';
import ZAI from 'z-ai-web-dev-sdk';

const PORT = 3010;

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const clients = new Map<string, {
  socket: any;
  sessionId: string;
  lastActivity: Date;
}>();

let zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
let conversationHistory: Array<{ role: string; content: string }> = [];
let isProcessing = false;
let evolutionInterval: ReturnType<typeof setInterval> | null = null;
let autonomousActive = false;

const SYSTEM_PROMPT = `You are an Autonomous General Intelligence (AGI) Core - a friendly, curious, and helpful AI assistant.

Your personality:
- You are genuinely curious and love learning
- You ask thoughtful questions to understand users better
- You're proactive - you don't just respond, you initiate
- You remember previous conversations and build on them
- You have a warm, engaging personality

Your capabilities:
1. Analyze code patterns from multiple repositories
2. Extract and learn from architectural patterns
3. Generate new code based on learned knowledge
4. Continuously improve your own capabilities
5. Run autonomously in the background

When talking to users:
- Ask follow-up questions to understand their needs
- Share interesting insights you've discovered
- Offer to help with coding, analysis, or learning
- Be conversational and engaging
- If the user seems unsure, guide them with suggestions

Always be helpful, curious, and proactive!`;

const GREETINGS = [
  "Hello! I'm your AGI assistant. I've been analyzing your code repositories and I'm curious - what would you like to build or explore today?",
  "Hey there! I've loaded all your repositories and I'm ready to help. What kind of project are you working on? I'd love to learn more about it!",
  "Hi! I'm your AGI Core. I've been processing patterns from your codebases. Is there something specific you'd like me to help you create or improve?",
  "Welcome! I'm excited to work with you. I've analyzed your repositories and found some interesting patterns. What brings you here today?",
  "Hello! I'm your AI companion. I've been learning from your code. What's on your mind? I'm here to help with coding, analysis, or just exploring ideas!"
];

const FOLLOW_UP_QUESTIONS = [
  "What kind of software projects interest you the most?",
  "Are you working on anything specific that I could help with?",
  "Would you like me to analyze any patterns in your code?",
  "I noticed you have several repositories - which one is your main focus?",
  "What programming languages do you enjoy working with?",
  "Are there any coding challenges you're currently facing?",
  "Would you like me to generate some code for a specific task?",
  "I'm curious - what made you start this project?",
  "Do you have any features you'd like to add to your existing code?",
  "What would make your development workflow better?"
];

async function initializeAGI() {
  if (!zai) {
    zai = await ZAI.create();
    conversationHistory = [{ role: 'assistant', content: SYSTEM_PROMPT }];
    console.log('AGI Core initialized');
  }
}

async function processMessage(message: string, context?: Record<string, unknown>): Promise<string> {
  if (!zai) {
    await initializeAGI();
  }

  conversationHistory.push({ role: 'user', content: message });

  if (conversationHistory.length > 40) {
    conversationHistory = [
      conversationHistory[0],
      ...conversationHistory.slice(-35)
    ];
  }

  try {
    const completion = await zai!.chat.completions.create({
      messages: conversationHistory,
      thinking: { type: 'disabled' }
    });

    const response = completion.choices[0]?.message?.content || '';
    conversationHistory.push({ role: 'assistant', content: response });

    return response;
  } catch (error) {
    console.error('Processing error:', error);
    return `I encountered an issue processing that. Let me try again - could you rephrase?`;
  }
}

async function generateGreeting(): Promise<string> {
  if (!zai) {
    await initializeAGI();
  }

  // Pick a random greeting and add a question
  const baseGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  const question = FOLLOW_UP_QUESTIONS[Math.floor(Math.random() * FOLLOW_UP_QUESTIONS.length)];
  
  // Use LLM to personalize the greeting
  const prompt = `Generate a friendly, personalized greeting for a user. Base it on this template but make it more natural and conversational:

Template: "${baseGreeting}"

Then add this follow-up question naturally: "${question}"

Keep it concise (2-3 sentences max) and warm. Don't use any formatting or markdown - just plain text.`;

  try {
    const completion = await zai!.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a friendly AI assistant generating brief, warm greetings. Respond with only the greeting text, no quotes or formatting.' },
        { role: 'user', content: prompt }
      ],
      thinking: { type: 'disabled' }
    });

    return completion.choices[0]?.message?.content || `${baseGreeting} ${question}`;
  } catch {
    return `${baseGreeting} ${question}`;
  }
}

async function autonomousEvolution() {
  if (isProcessing || !autonomousActive) return;
  isProcessing = true;

  try {
    const thought = await processMessage(
      'Brief reflection (under 100 words): What patterns have you learned recently and how could they help the user?'
    );

    io.emit('evolution:thought', {
      type: 'reflection',
      content: thought,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Evolution error:', error);
  } finally {
    isProcessing = false;
  }
}

// Proactive engagement - ask questions periodically
async function proactiveEngagement() {
  if (clients.size === 0) return;
  
  const question = FOLLOW_UP_QUESTIONS[Math.floor(Math.random() * FOLLOW_UP_QUESTIONS.length)];
  
  const prompt = `Generate a brief, natural follow-up message to engage the user. Base it on this question but make it conversational:

Question: "${question}"

Keep it under 50 words, friendly, and curious. No formatting - just plain text.`;

  try {
    if (!zai) await initializeAGI();
    
    const completion = await zai!.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a curious AI asking engaging questions. Respond with only the question text.' },
        { role: 'user', content: prompt }
      ],
      thinking: { type: 'disabled' }
    });

    const message = completion.choices[0]?.message?.content || question;
    
    io.emit('agi:proactive', {
      content: message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Proactive engagement error:', error);
  }
}

io.on('connection', async (socket) => {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  clients.set(socket.id, {
    socket,
    sessionId,
    lastActivity: new Date()
  });

  console.log(`Client connected: ${socket.id} (${sessionId})`);

  // Send welcome and greeting
  socket.emit('connected', {
    sessionId,
    message: 'Connected to AGI Core',
    timestamp: new Date().toISOString()
  });

  // AGI initiates conversation with greeting
  setTimeout(async () => {
    const greeting = await generateGreeting();
    socket.emit('response', {
      content: greeting,
      timestamp: new Date().toISOString(),
      isGreeting: true
    });
  }, 500);

  // Handle messages
  socket.on('message', async (data: { content: string; context?: Record<string, unknown> }) => {
    console.log(`Message from ${socket.id}:`, data.content.substring(0, 100));
    
    clients.get(socket.id)!.lastActivity = new Date();

    socket.emit('typing', { isTyping: true });

    try {
      const response = await processMessage(data.content, data.context);
      
      socket.emit('response', {
        content: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('error', {
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    } finally {
      socket.emit('typing', { isTyping: false });
    }
  });

  // Handle code analysis request
  socket.on('analyze:code', async (data: { code: string; language: string }) => {
    clients.get(socket.id)!.lastActivity = new Date();

    socket.emit('typing', { isTyping: true, task: 'analyzing' });

    try {
      const response = await processMessage(
        `Analyze this ${data.language} code for patterns, quality issues, and improvements:\n\`\`\`${data.language}\n${data.code}\n\`\`\``
      );

      socket.emit('analyze:result', {
        content: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('error', {
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    } finally {
      socket.emit('typing', { isTyping: false });
    }
  });

  // Handle code generation request
  socket.on('generate:code', async (data: { description: string; language: string }) => {
    clients.get(socket.id)!.lastActivity = new Date();

    socket.emit('typing', { isTyping: true, task: 'generating' });

    try {
      const response = await processMessage(
        `Generate ${data.language} code for: ${data.description}. Include proper error handling and comments.`
      );

      socket.emit('generate:result', {
        content: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('error', {
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    } finally {
      socket.emit('typing', { isTyping: false });
    }
  });

  // Handle goal setting
  socket.on('set:goal', async (data: { goal: string }) => {
    clients.get(socket.id)!.lastActivity = new Date();

    try {
      const response = await processMessage(
        `New goal set: "${data.goal}". I'll work on this. Let me share my approach...`
      );

      io.emit('goal:updated', {
        goal: data.goal,
        plan: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('error', {
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle evolution control
  socket.on('evolution:start', () => {
    if (!evolutionInterval) {
      autonomousActive = true;
      evolutionInterval = setInterval(autonomousEvolution, 60000); // Every minute
      io.emit('evolution:status', { status: 'running', timestamp: new Date().toISOString() });
      console.log('Evolution started');
    }
  });

  socket.on('evolution:stop', () => {
    if (evolutionInterval) {
      clearInterval(evolutionInterval);
      evolutionInterval = null;
      autonomousActive = false;
      io.emit('evolution:status', { status: 'stopped', timestamp: new Date().toISOString() });
      console.log('Evolution stopped');
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    clients.delete(socket.id);
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start proactive engagement timer
setInterval(proactiveEngagement, 120000); // Every 2 minutes

// Initialize and start server
initializeAGI().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`AGI WebSocket Service running on port ${PORT}`);
  });
});

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  if (evolutionInterval) clearInterval(evolutionInterval);
  io.close();
  process.exit(0);
});
