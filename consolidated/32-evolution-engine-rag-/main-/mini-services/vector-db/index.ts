// mini-services/vector-db/index.ts

import { Server, Socket } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';
import OpenAI from 'openai';

// Constants
enum Ports {
  VECTOR_DB = 3003,
}

// Interfaces and Types
interface Metadata {
  repoId?: string;
  repoName?: string;
  filePath?: string;
  fileName?: string;
  language?: string;
  type?: string;
}

interface VectorDoc {
  id: string;
  text: string;
  embedding: number[];
  metadata: Metadata;
  createdAt: Date;
}

interface VectorDBStats {
  totalVectors: number;
  totalDocuments: number;
  searchQueries: number;
  totalSearchTime: number;
  averageTime: number;
}

interface VectorDBState {
  socket: Socket;
  mode: 'menu' | 'processing' | 'searching' | 'generating';
  stats: VectorDBStats;
  currentOperation: string | null;
}

interface RagSource extends Metadata {
  relevance: number;
}

// Global State
const vectorStore: Map<string, VectorDoc> = new Map();
const sessions = new Map<string, VectorDBState>();
let openaiClient: OpenAI | null = null;

// Initialization
const httpServer: HttpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Utility Functions
async function initializeOpenAI(): Promise<boolean> {
  if (openaiClient) return true;
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.error('OpenAI API key not configured. Set OPENAI_API_KEY.');
      return false;
    }

    openaiClient = new OpenAI({
      apiKey: openaiKey
    });
    return true;
  } catch (error) {
    console.error('Error initializing OpenAI:', error);
    return false;
  }
}

function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  if (!text) return [];

  const sentences = text.split(/([.?!]\s+|\n{2,})/g).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const part of sentences) {
    if (currentChunk.length + part.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = part;
    } else {
      currentChunk += part;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.flatMap(chunk => {
    if (chunk.length > maxChunkSize) {
      const subChunks: string[] = [];
      let temp = chunk;
      while (temp.length > maxChunkSize) {
        subChunks.push(temp.substring(0, maxChunkSize));
        temp = temp.substring(maxChunkSize);
      }
      if (temp.length > 0) {
        subChunks.push(temp);
      }
      return subChunks;
    }
    return chunk;
  });
}

async function generateEmbedding(text: string): Promise<number[]> {
  if (!openaiClient) {
    const initialized = await initializeOpenAI();
    if (!initialized) {
      throw new Error('OpenAI client is not initialized.');
    }
  }

  try {
    const response = await openaiClient!.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const normProduct = Math.sqrt(normA) * Math.sqrt(normB);

  return normProduct === 0 ? 0 : dotProduct / normProduct;
}

function searchSimilar(queryEmbedding: number[], limit: number = 10, threshold: number = 0.7): Array<{ doc: VectorDoc; score: number }> {
  const results: Array<{ doc: VectorDoc; score: number }> = [];

  for (const doc of vectorStore.values()) {
    const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
    if (similarity >= threshold) {
      results.push({ doc, score: similarity });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function ragRetrieval(query: string, limit: number = 5): Promise<{
  context: string[];
  sources: RagSource[];
}> {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const similarDocs = searchSimilar(queryEmbedding, limit);

    const context: string[] = [];
    const sources: RagSource[] = [];
    const addedSources = new Set<string>();

    for (const { doc, score } of similarDocs) {
      context.push(doc.text);

      const sourceKey = `${doc.metadata.repoName}:${doc.metadata.fileName}:${doc.metadata.filePath}`;

      if (doc.metadata.repoName && doc.metadata.fileName && !addedSources.has(sourceKey)) {
        sources.push({
          repoName: doc.metadata.repoName,
          filePath: doc.metadata.filePath || 'N/A',
          fileName: doc.metadata.fileName,
          language: doc.metadata.language,
          relevance: score,
        });
        addedSources.add(sourceKey);
      }
    }

    return { context, sources };
  } catch (error) {
    console.error('RAG retrieval error:', error);
    return { context: [], sources: [] };
  }
}

// Data Ingestion
async function addVectorsFromScrapedData(): Promise<number> {
  let addedCount = 0;
  try {
    const response = await fetch('http://localhost:3000/api/scraped-repos');
    if (!response.ok) {
      throw new Error(`Failed to fetch scraped repos: ${response.statusText}`);
    }
    const data = await response.json();
    const repos = data.repos || [];

    for (const repo of repos) {
      if (repo.readme) {
        const chunks = chunkText(repo.readme);

        for (const chunk of chunks) {
          try {
            const embedding = await generateEmbedding(chunk);

            const docId = `${repo.id}-${Date.now()}-${addedCount}`;

            const vectorDoc: VectorDoc = {
              id: docId,
              text: chunk,
              embedding,
              metadata: {
                repoId: repo.id,
                repoName: repo.name,
                filePath: '',
                fileName: 'README.md',
                type: 'documentation',
                language: repo.language || 'unknown'
              },
              createdAt: new Date()
            };

            vectorStore.set(vectorDoc.id, vectorDoc);
            addedCount++;
          } catch (error) {
            console.warn(`Skipping chunk embedding for repo ${repo.name}:`, error);
          }
        }
      }
    }

    return addedCount;
  } catch (error) {
    console.error('Error adding vectors from scraped data:', error);
    return 0;
  }
}

// Menu Definitions
enum MenuType {
  MAIN = 'main',
  EMBEDDING = 'embedding',
  RAG_SEARCH = 'ragSearch',
  STATISTICS = 'statistics',
}

const MENUS: Record<MenuType, string> = {
  [MenuType.MAIN]: `
╔══════════════════════════════════════════════════════════════╗
║     ████╗██████╗███████╗███████╗███████╗███████╗    ║
║     ██╔════╝██╔════╝██╔════╝██╔════╝██╔════╝    ║
║     ███████╗██╔████╗██╔████╗██╔████╗██╔████╗██████╗    ║
║     ╚════██║██╔════╝██╔════╝██╔════╝██╔████╝██╔══██║    ║
║     ███████║██║██████╗██║██████╗██║██████╗███████║    ║
║                                                               ║
║           VECTOR DATABASE & RAG SERVICE v1.1              ║
║                                                               ║
╠══════════════════════════════════════════════════════════════╣
║  [1] 🧠 EMBED SCRAPED DATA  | [2] 🔍 RAG SEARCH             ║
║  [3] 📊 STATISTICS          | [4] 🗑️ CLEAR DATABASE         ║
║  [5] 🔙 BACK TO MAIN SCRAPER | [? / help] for commands     ║
╚══════════════════════════════════════════════════════════════╝

> `,

  [MenuType.EMBEDDING]: `
╔══════════════════════════════════════════════════════════════╗
║               EMBEDDING MODE (Processing)                   ║
╠════════════════════════════════════════════════════════════╣
║                                                               ║
║  🧠 GENERATING EMBEDDINGS...                                ║
║  Current Operation: ${'Current Operation Placeholder'}      ║
║                                                               ║
╚════════════════════════════════════════════════════════════════╝

> `,

  [MenuType.RAG_SEARCH]: `
╔════════════════════════════════════════════════════════════════╗
║               RAG SEARCH MODE                             ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  🔍 ENTER YOUR QUERY (Use ESC to return to Main Menu)       ║
║                                                               ║
║  >                                                            ║
║                                                               ║
╚══════════════════════════════════════════════════════╝

> `,

  [MenuType.STATISTICS]: `
(Placeholder for dynamically generated stats menu)
> `,
};

// Socket Handlers and Session Management
function getSession(socketId: string): VectorDBState | undefined {
  return sessions.get(socketId);
}

function showMenu(session: VectorDBState, menu: MenuType, data?: Record<string, string>) {
  session.mode = 'menu';
  session.socket.emit('cli-clear');
  let output = MENUS[menu];

  if (data) {
    Object.keys(data).forEach(key => {
      output = output.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), data[key]);
    });
  }

  session.socket.emit('cli-output', output);
}

async function handleInput(socket: Socket, data: { input: string | null, key: string | null }) {
  const session = getSession(socket.id);
  if (!session) return;

  const input = data.input?.trim().toLowerCase() ?? '';
  const key = data.key?.toLowerCase() ?? '';

  if (session.mode === 'menu') {
    if (input === '1' || input === 'embed') {
      await embedScrapedData(session);
    } else if (input === '2' || input === 'search') {
      session.mode = 'searching';
      showMenu(session, MenuType.RAG_SEARCH);
    } else if (input === '3' || input === 'stats') {
      updateStatistics(session);
    } else if (input === '4' || input === 'clear') {
      clearDatabase(session);
    } else if (input === '5' || input === 'back') {
      socket.emit('cli-switch-mode', { mode: 'scraper' });
    } else if (input === 'help' || input === '?') {
      showHelpScreen(socket);
    } else if (input === 'exit') {
      socket.emit('cli-exit');
    }
  } else if (session.mode === 'searching') {
    if (key === 'escape') {
      session.mode = 'menu';
      showMenu(session, MenuType.MAIN);
    } else if (data.input && input.length > 0) {
      await handleRagSearch(session, data.input);
    }
  }
}

async function handleRagSearch(session: VectorDBState, query: string) {
  const startTime = Date.now();

  session.mode = 'processing';
  session.currentOperation = 'Performing RAG search';

  session.socket.emit('cli-clear');
  session.socket.emit('cli-output', `🔍 Performing RAG search...\nQuery: "${query}"\n`);

  try {
    const { context, sources } = await ragRetrieval(query, 5);
    const elapsed = Date.now() - startTime;

    session.stats.searchQueries++;
    session.stats.totalSearchTime += elapsed;
    session.stats.averageTime = Math.round(session.stats.totalSearchTime / session.stats.searchQueries);

    displayRagResults(session, query, context, sources, elapsed);
  } catch (error) {
    console.error('RAG Search Execution Error:', error);
    session.socket.emit('cli-output', `\n❌ RAG Search Failed: ${error instanceof Error ? error.message : 'Unknown Error'}\n`);
  } finally {
    session.mode = 'searching';
    session.currentOperation = null;
  }
}

function displayRagResults(session: VectorDBState, query: string, context: string[], sources: RagSource[], elapsed: number) {
  session.socket.emit('cli-output', `\n✓ Search complete in ${elapsed}ms.\n`);

  if (context.length > 0) {
    session.socket.emit('cli-output', `\n📝 RELEVANT CONTEXT (Top ${context.length} Chunks):\n`);
    context.forEach((ctx, index) => {
      const snippet = ctx.substring(0, 150).replace(/\n/g, ' ');
      session.socket.emit('cli-output', `[${index + 1}] ${snippet}${ctx.length > 150 ? '...' : ''}\n`);
    });
    session.socket.emit('cli-output', '─'.repeat(70) + '\n');
  } else {
    session.socket.emit('cli-output', "⚠️ No context retrieved above the similarity threshold (0.7).\n");
  }

  if (sources.length > 0) {
    session.socket.emit('cli-output', `\n📂 SOURCE REPOSITORIES (${sources.length} Unique Sources):\n`);

    sources.forEach((source, index) => {
      session.socket.emit('cli-output', `[${index + 1}] ${source.repoName}/${source.fileName}`);
      session.socket.emit('cli-output', `    Path: ${source.filePath}`);
      session.socket.emit('cli-output', `    Relevance: ${(source.relevance * 100).toFixed(2)}%`);
    });
  }

  session.socket.emit('cli-output', `\n${'='.repeat(70)}\n`);
  session.socket.emit('cli-output', `[ENTER] Search Again | [ESC] Return to Menu\n`);
}

function showHelpScreen(socket: Socket) {
  socket.emit('cli-clear');
  socket.emit('cli-output', `
╔════════════════════════════════════════════════════════════════╗
║                       VECTOR DB COMMAND HELP                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  GENERAL COMMANDS:                                            ║
║  ───────────────────────────────────────────────────         ║
║  1 / embed      : Ingests scraped repository data into DB.   ║
║  2 / search     : Enters Interactive RAG Search Mode.         ║
║  3 / stats      : Displays database statistics.              ║
║  4 / clear      : Wipes all vectors from memory.             ║
║  5 / back       : Returns to the main Scraper service CLI.    ║
║  exit           : Closes the Vector DB connection.           ║
║                                                               ║
║  RAG SEARCH MODE:                                             ║
║  ───────────────────────────────────────────────────         ║
║  Enter natural language query and press [ENTER] to search.   ║
║  Press [ESC] to exit search mode and return to menu.         ║
║                                                               ║
║  ARCHITECTURE NOTES:                                          ║
║  ───────────────────────────────────────────────────         ║
║  - Storage: In-memory Map (non-persistent).                  ║
║  - Embedding Model: OpenAI text-embedding-3-small.           ║
║  - Similarity: Cosine Similarity (Threshold >= 0.7).         ║
║  - Chunking: Attempts to maintain sentence/paragraph structure.║
║                                                               ║
╚════════════════════════════════════════════════════════════════╝

> `, true);
}

io.on('connection', async (socket: Socket) => {
  console.log(`Vector DB client connected: ${socket.id}`);

  const initialized = await initializeOpenAI();

  const session: VectorDBState = {
    socket,
    mode: 'menu',
    stats: {
      totalVectors: 0,
      totalDocuments: 0,
      searchQueries: 0,
      totalSearchTime: 0,
      averageTime: 0
    },
    currentOperation: null
  };

  sessions.set(socket.id, session);

  socket.emit('cli-clear');
  if (!initialized) {
    socket.emit('cli-output', '⚠️ WARNING: OpenAI client failed to initialize. Embedding/Search functions will fail.\n');
  }
  showMenu(session, MenuType.MAIN);

  socket.on('vector-input', handleInput.bind(null, socket));

  socket.on('disconnect', () => {
    console.log(`Vector DB client disconnected: ${socket.id}`);
    sessions.delete(socket.id);
  });
});

// Operation Handlers
async function embedScrapedData(session: VectorDBState) {
  session.mode = 'processing';
  session.currentOperation = 'Embedding scraped data';

  session.socket.emit('cli-clear');
  let menuOutput = MENUS[MenuType.EMBEDDING];
  menuOutput = menuOutput.replace('${Current Operation Placeholder}', session.currentOperation || 'Initializing...');
  session.socket.emit('cli-output', menuOutput);

  try {
    const addedCount = await addVectorsFromScrapedData();

    session.stats.totalVectors = vectorStore.size;
    session.stats.totalDocuments = vectorStore.size;

    session.socket.emit('cli-clear');
    showMenu(session, MenuType.MAIN);
    session.socket.emit('cli-output', `\n✓ Successfully embedded ${addedCount} new chunks.\n`);
    session.socket.emit('cli-output', `Total vectors in database: ${vectorStore.size.toLocaleString()}\n`);
  } catch (error) {
    console.error('Error embedding data:', error);
    session.socket.emit('cli-output', `\n❌ Embedding Error: ${(error as Error).message || String(error)}\n`);
    showMenu(session, MenuType.MAIN);
  } finally {
    session.currentOperation = null;
  }
}

function updateStatistics(session: VectorDBState) {
  const sortedRepos = new Map<string, number>();
  const sortedLangs = new Map<string, number>();

  for (const doc of vectorStore.values()) {
    if (doc.metadata.repoName) {
      sortedRepos.set(doc.metadata.repoName, (sortedRepos.get(doc.metadata.repoName) || 0) + 1);
    }
    if (doc.metadata.language && doc.metadata.language !== 'unknown') {
      sortedLangs.set(doc.metadata.language, (sortedLangs.get(doc.metadata.language) || 0) + 1);
    }
  }

  const topRepos = [...sortedRepos.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const topLangs = [...sortedLangs.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  session.stats.totalVectors = vectorStore.size;
  session.stats.totalDocuments = vectorStore.size;

  const repoLines = topRepos.map((repo, i) =>
    `║  [${i + 1}] ${repo[0].padEnd(30)}: ${repo[1].toLocaleString().padStart(5)} vectors ║`
  ).join('\n');

  const langLines = topLangs.map((lang, i) =>
    `║  [${i + 1}] ${lang[0].charAt(0).toUpperCase() + lang[0].slice(1).padEnd(11)}: ${lang[1].toLocaleString().padStart(5)} vectors ║`
  ).join('\n');

  const statsOutput = `
╔══════════════════════════════════════════════════════════════╗
║               VECTOR DATABASE STATISTICS                       ║
╠════════════════════════════════════════════════════════════╣
║  📊 OVERALL METRICS                                        ║
║  Total Vectors: ${vectorStore.size.toLocaleString().padStart(10)}         ║
║  Total Search Queries: ${session.stats.searchQueries.toLocaleString().padStart(10)}      ║
║  Avg Search Time: ${session.stats.averageTime}ms (Last ${session.stats.searchQueries} Q) ║
║                                                               ║
║  📂 TOP REPOSITORIES BY VECTORS                      ║
${repoLines.padEnd(67, ' ')}
║                                                               ║
║  🌐 TOP LANGUAGES                                         ║
${langLines.padEnd(67, ' ')}
║                                                               ║
║  [1] 🗑️ CLEAR DATABASE                                      ║
║  [2] 🔙 BACK TO MAIN MENU                                     ║
║                                                               ║
╚════════════════════════════════════════════════════════════════╝
`;
  session.socket.emit('cli-clear');
  session.socket.emit('cli-output', statsOutput);
  session.mode = 'menu';
}

function clearDatabase(session: VectorDBState) {
  vectorStore.clear();
  session.stats = {
    totalVectors: 0,
    totalDocuments: 0,
    searchQueries: 0,
    totalSearchTime: 0,
    averageTime: 0
  };

  session.socket.emit('cli-clear');
  session.socket.emit('cli-output', `\n🗑️ Database cleared. All vectors removed.\n`);
  showMenu(session, MenuType.MAIN);
}

// Server Start
httpServer.listen(Ports.VECTOR_DB, () => {
  console.log(`╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║                                                               ║`);
  console.log(`║   🧠 VECTOR DB SERVICE STARTED ON PORT ${Ports.VECTOR_DB}                  ║`);
  console.log(`║                                                               ║`);
  console.log(`║   Status: ${openaiClient ? 'OpenAI Initialized' : 'OpenAI FAILED'}       ║`);
  console.log(`║   Initial Vectors: ${vectorStore.size}                          ║`);
  console.log(`║                                                               ║`);
  console.log(`╠══════════════════════════════════════════════════════════════╣`);
});