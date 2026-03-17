// Import required modules
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

// Configuration
enum Config {
  PORT = 3003,
  SOCKET_IO_PATH = '/',
  PING_TIMEOUT = 60000,
  PING_INTERVAL = 25000,
}

// Type Definitions
interface User {
  id: string;
  username: string;
}

enum MessageType {
  USER = 'user',
  SYSTEM = 'system',
}

interface Message {
  id: string;
  username: string;
  content: string;
  timestamp: Date;
  type: MessageType;
}

interface JoinData {
  username: string;
}

interface MessageData {
  content: string;
  username: string;
}

// State Management
const users = new Map<string, User>();

// Utility Functions
const generateMessageId = (): string => Math.random().toString(36).substring(2, 11);

const createSystemMessage = (content: string): Message => ({
  id: generateMessageId(),
  username: 'System',
  content,
  timestamp: new Date(),
  type: MessageType.SYSTEM,
});

const createUserMessage = (username: string, content: string): Message => ({
  id: generateMessageId(),
  username,
  content,
  timestamp: new Date(),
  type: MessageType.USER,
});

// Server Setup
const httpServer: HttpServer = createServer();

const io = new SocketIOServer(httpServer, {
  path: Config.SOCKET_IO_PATH,
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: Config.PING_TIMEOUT,
  pingInterval: Config.PING_INTERVAL,
});

// Socket Event Handlers
const handleConnection = (socket: Socket): void => {
  console.log(`New connection established: ${socket.id}`);

  // Debug/Test Handler
  const handleTest = (data: unknown): void => {
    console.log(`[Test] Received test message from ${socket.id}:`, data);
    socket.emit('test-response', {
      message: 'Server received test message',
      data,
      timestamp: new Date().toISOString(),
    });
  };
  socket.on('test', handleTest);

  // Join Handler
  const handleJoin = (data: JoinData): void => {
    const { username } = data;

    if (!username) {
      socket.emit('error', { message: 'Username is required to join.' });
      console.warn(`Connection ${socket.id} attempted to join without a username.`);
      return;
    }

    if (Array.from(users.values()).some((u) => u.username === username)) {
      console.log(`User ${socket.id} requested username ${username}, which is taken (informational).`);
    }

    const user: User = {
      id: socket.id,
      username,
    };
    users.set(socket.id, user);

    const joinMessage = createSystemMessage(`${username} joined the chat room.`);
    io.emit('user-joined', { user, message: joinMessage });
    console.log(`[Join] ${username} (${socket.id}) joined. Total online: ${users.size}`);

    const usersList = Array.from(users.values());
    socket.emit('users-list', { users: usersList });
  };
  socket.on('join', handleJoin);

  // Message Handler
  const handleMessage = (data: MessageData): void => {
    const { content, username } = data;
    const user = users.get(socket.id);

    if (!user) {
      console.warn(`Received message from unknown socket: ${socket.id}`);
      return;
    }

    if (user.username !== username) {
      console.warn(`Mismatched username on socket ${socket.id}: Expected ${user.username}, got ${username}. Ignoring message.`);
      return;
    }

    if (!content || content.trim() === '') {
      return;
    }

    const message = createUserMessage(username, content.trim());
    io.emit('message', message);
    console.log(`[Chat] ${username}: ${content.substring(0, 30)}...`);
  };
  socket.on('message', handleMessage);

  // Disconnect Handler
  const handleDisconnect = (): void => {
    const user = users.get(socket.id);

    if (user) {
      users.delete(socket.id);

      const leaveMessage = createSystemMessage(`${user.username} left the chat room.`);
      io.emit('user-left', { user: { id: socket.id, username: user.username }, message: leaveMessage });
      console.log(`[Disconnect] ${user.username} left. Remaining online users: ${users.size}`);
    } else {
      console.log(`Client disconnected: ${socket.id} (was not tracked as a joined user)`);
    }
  };
  socket.on('disconnect', handleDisconnect);

  // Error Handler
  const handleError = (error: Error): void => {
    console.error(`Socket error (${socket.id}):`, error.message || error);
  };
  socket.on('error', handleError);
};

io.on('connection', handleConnection);

// Server Lifecycle and Startup
const startServer = (): void => {
  httpServer.listen(Config.PORT, () => {
    console.log(`WebSocket server running on http://localhost:${Config.PORT} (Socket.IO path: ${Config.SOCKET_IO_PATH})`);
  });
};
startServer();

// Handles graceful shutdown for SIGTERM (e.g., Docker stop)
const shutdown = (signal: string): void => {
  console.log(`\nReceived ${signal} signal, initiating graceful shutdown...`);
  httpServer.close(() => {
    console.log('HTTP server closed successfully.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));