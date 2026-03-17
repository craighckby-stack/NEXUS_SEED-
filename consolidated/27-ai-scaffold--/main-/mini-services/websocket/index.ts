import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { URL } from 'url';

// --- Configuration Constants ---

const DEFAULT_PORT = 3003;
const port = Number(process.env.PORT || DEFAULT_PORT);
const appName = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const appUrl = new URL(appName);
const origin = `${appUrl.protocol}://${appUrl.host}`;

// Custom Error Type
class WebSocketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebSocketError';
  }
}

// Constant Rooms
const DEFAULT_ROOMS = ['metrics', 'agents', 'reasoning', 'memory', 'security'] as const;

// --- Types ---

type RoomName = typeof DEFAULT_ROOMS[number];

type RoomEventDetails = {
  readonly JOIN: string;
  readonly JOINED: string;
  readonly BROADCAST: string;
  readonly UPDATE: string;
};

type RoomEventMap = Record<RoomName, RoomEventDetails>;

// --- Utilities & Pre-calculation ---

const log = (message: string, ...args: unknown[]) => {
  console.log(`[WS] ${message}`, ...args);
};

const ROOM_EVENTS: RoomEventMap = DEFAULT_ROOMS.reduce(
  (acc, room) => ({
    ...acc,
    [room]: {
      JOIN: `join-${room}`,
      JOINED: `joined-${room}`,
      BROADCAST: `broadcast-${room}`,
      UPDATE: `${room}-update`,
    },
  }),
  {} as RoomEventMap,
);

const ROOMS_ARRAY = DEFAULT_ROOMS as unknown as string[];

// --- Server Setup ---

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 10 * 1024 * 1024, // 10 MB
  transports: ['websocket', 'polling'],
  pingInterval: 25 * 1000, // 25 seconds
  pingTimeout: 60 * 1000, // 1 minute
});

const handleConnection = (socket: Socket) => {
  log(`Client connected: ${socket.id}`);

  socket.join(ROOMS_ARRAY);
  socket.emit('connected', {
    socketId: socket.id,
    timestamp: Date.now(),
    rooms: DEFAULT_ROOMS,
  });

  const setupRoomListeners = (socket: Socket) => {
    for (const room of DEFAULT_ROOMS) {
      const events = ROOM_EVENTS[room];

      socket.on(events.JOIN, () => {
        if (!socket.rooms.has(room)) {
          socket.join(room);
          socket.emit(events.JOINED, { room });
          log(`Socket ${socket.id} explicitly joined room: ${room}`);
        } else {
          socket.emit(events.JOINED, { room, status: 'already_joined' });
        }
      });

      socket.on(events.BROADCAST, (data: unknown) => {
        socket.to(room).emit(events.UPDATE, data);
      });
    }
  };

  setupRoomListeners(socket);

  socket.on('disconnect', (reason: string) => {
    log(`Client ${socket.id} disconnected (Reason: ${reason})`);
  });
};

io.on('connection', handleConnection);

httpServer.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    throw new WebSocketError(`Port ${port} is already in use.`);
  } else {
    throw new WebSocketError(`SERVER ERROR:`, err);
  }
});

httpServer.listen(port, () => {
  log(`WebSocket service running on port ${port} (Origin: ${origin})`);
});

export { io, httpServer };
```

**