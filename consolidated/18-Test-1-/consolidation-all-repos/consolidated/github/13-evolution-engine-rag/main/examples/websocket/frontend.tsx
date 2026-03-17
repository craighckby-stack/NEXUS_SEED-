// --- Type Definitions ---

interface User {
  id: string;
  username: string;
}

enum MessageType {
  User = 'user',
  System = 'system',
}

interface Message {
  id: string;
  username: string;
  content: string;
  timestamp: string | number; 
  type: MessageType;
}

// --- Constants ---

const SOCKET_PATH = '/';
const SOCKET_PORT_HINT = '3003'; 

// --- Component ---

export default function SocketDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Memoized connection logic
  useEffect(() => {
    let socketInstance: Socket | null = null;

    try {
      socketInstance = io(SOCKET_PATH, {
        query: { XTransformPort: SOCKET_PORT_HINT },
        transports: ['websocket', 'polling'],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: Infinity, 
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      socketInstance.on('message', (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
      });

      socketInstance.on('user-joined', (data: { user: User; message: Message }) => {
        setMessages((prev) => [...prev, data.message]);
        setUsers((prev) => {
          if (!prev.some((u) => u.id === data.user.id)) {
            return [...prev, data.user];
          }
          return prev;
        });
      });

      socketInstance.on('user-left', (data: { user: User; message: Message }) => {
        setMessages((prev) => [...prev, data.message]);
        setUsers((prev) => prev.filter((u) => u.id !== data.user.id));
      });

      socketInstance.on('users-list', (data: { users: User[] }) => {
        setUsers(data.users);
      });
    } catch (error) {
      console.error('Socket connection error:', error);
    }

    return () => {
      if (socketInstance) {
        socketInstance.off();
        socketInstance.disconnect();
      }
    };
  }, []);

  // Memoize handlers to prevent unnecessary re-renders if dependencies don't change
  const handleJoin = useCallback(() => {
    if (socket && username.trim() && isConnected) {
      const trimmedUsername = username.trim();
      socket.emit('join', { username: trimmedUsername });
      setIsUsernameSet(true);
    }
  }, [socket, username, isConnected]);

  const sendMessage = useCallback(() => {
    const trimmedMessage = inputMessage.trim();
    if (socket && trimmedMessage && username.trim()) {
      socket.emit('message', {
        content: trimmedMessage,
        username: username.trim(),
      });
      setInputMessage('');
    }
  }, [socket, inputMessage, username]);

  const handleInputKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (isUsernameSet) {
          sendMessage();
        } else {
          handleJoin();
        }
      }
    },
    [isUsernameSet, sendMessage, handleJoin]
  );

  // --- Render Logic Components ---

  const renderUsernameInput = () => (
    <div className="space-y-2">
      <Input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyPress={handleInputKeyPress}
        placeholder="Enter your username..."
        disabled={!isConnected || isUsernameSet}
        aria-label="Username input"
      />
      <Button
        onClick={handleJoin}
        disabled={!isConnected || !username.trim() || isUsernameSet}
        className="w-full"
      >
        Join Chat
      </Button>
    </div>
  );

  const renderMessageDisplay = () => (
    <ScrollArea className="h-80 w-full border rounded-md p-4">
      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center pt-10">No messages yet. Join the chat!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="pb-2 border-b last:border-b-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  <p
                    className={`text-sm font-semibold ${
                      msg.type === MessageType.System
                        ? 'text-indigo-600 italic'
                        : 'text-gray-800'
                    }`}
                  >
                    {msg.username}
                  </p>
                  <p
                    className={`${
                      msg.type === MessageType.System
                        ? 'text-indigo-500 text-sm italic'
                        : 'text-gray-900 text-base'
                    } break-words`}
                  >
                    {msg.content}
                  </p>
                </div>
                <span className="text-xs text-gray-500 shrink-0 ml-2">
                  {typeof msg.timestamp === 'number'
                    ? new Date(msg.timestamp).toLocaleTimeString()
                    : msg.timestamp.substring(11, 16)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );

  const renderChatInput = () => (
    <div className="flex space-x-2 pt-2">
      <Input
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={handleInputKeyPress}
        placeholder={isConnected ? 'Type a message...' : 'Waiting for connection...'}
        disabled={!isConnected || !isUsernameSet}
        className="flex-1"
        aria-label="Message input"
      />
      <Button
        onClick={sendMessage}
        disabled={!isConnected || !inputMessage.trim() || !isUsernameSet}
      >
        Send
      </Button>
    </div>
  );

  // --- Main Render ---

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Realtime Chat Demo
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              Status: {isConnected ? 'Online' : 'Offline'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isUsernameSet ? (
            <>
              <p className="text-sm text-gray-500 text-center">
                {isConnected
                  ? 'Enter a username to join the chat.'
                  : 'Attempting to connect to WebSocket server...'}
              </p>
              {renderUsernameInput()}
            </>
          ) : (
            <>
              {renderMessageDisplay()}
              {renderChatInput()}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}