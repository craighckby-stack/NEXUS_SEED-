import { Server, Socket } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';
import OpenAI from 'openai';
import 'dotenv/config'; // Ensure environment variables are loaded

// --- 1. CONFIGURATION AND CONSTANTS ---

const CONFIG = {
  PORT: 3003,
  CORS_ORIGIN: '*',
  EMBEDDING_MODEL: 'text-embedding-3-small',
  SCRAPER_API_URL: 'http://localhost:3000/api/scraped-repos',
  CONFIG_API_URL: 'http://localhost:3000/api/evolution/config',
  EMBEDDING_CHUNK_SIZE: 1000,
  SIMILARITY_THRESHOLD: 0.7,
  SEARCH_LIMIT: 5,
};

// --- 2. TYPE DEFINITIONS ---

type SessionMode = 'menu' | 'processing' | 'searching';

interface Metadata {
  repoId?: string;
  repoName?: string;
  filePath?: string;
  fileName?: string;
  language?: string;
  type?: 'documentation' | 'code';
}

interface VectorDoc {
  id: string;
  text: string;
  embedding: number[];
  metadata: Metadata;
  createdAt: Date;
}

interface DBStats {
  totalVectors: number;
  searchQueries: number;
  totalRetrievalTime: number; // Used for calculating average time
}

interface SessionState {
  mode: SessionMode;
  stats: DBStats;
  currentOperation: string | null;
}

interface Session extends SessionState {
  socket: Socket;
}

interface RetrievalResult {
  context: string[];
  sources: Array<{ 
    repoName: string; 
    filePath: string; 
    fileName: string; 
    relevance: number 
  }>;
}

// --- 3. GLOBAL STATE & INITIALIZATION ---

const vectorStore: Map<string, VectorDoc> = new Map();
const sessions = new Map<string, Session>();
let openai: OpenAI | null = null;
let isInitialized = false;

// --- 4. SERVICES ---

/**
 * Service responsible for connecting to and utilizing OpenAI APIs.
 */
class EmbeddingService {
  private static instance: EmbeddingService;

  private constructor() {}

  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  public async initialize(): Promise<boolean> {
    if (isInitialized) return true;

    try {
      // Check for config/keys (simplified external config check)
      // const configResponse = await fetch(CONFIG.CONFIG_API_URL);
      // const config = await configResponse.json();

      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        throw new Error('OPENAI_API_KEY environment variable not configured.');
      }

      openai = new OpenAI({ apiKey: openaiKey });
      isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing OpenAI/Embedding Service:', error);
      return false;
    }
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    if (!openai && !(await this.initialize())) {
      throw new Error('Embedding service failed to initialize.');
    }

    try {
      const response = await openai!.embeddings.create({
        model: CONFIG.EMBEDDING_MODEL,
        input: text,
        encoding_format: 'float'
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('OpenAI embedding API call failed.');
    }
  }
}

/**
 * Service for vector operations: similarity, search, storage.
 */
class VectorDBService {

  public static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    // Calculate magnitude (norm)
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  public static searchSimilar(queryEmbedding: number[], limit: number = CONFIG.SEARCH_LIMIT): Array<{ doc: VectorDoc; score: number }> {
    const results: Array<{ doc: VectorDoc; score: number }> = [];
    
    for (const doc of vectorStore.values()) {
      const similarity = VectorDBService.cosineSimilarity(queryEmbedding, doc.embedding);
      
      if (similarity >= CONFIG.SIMILARITY_THRESHOLD) {
        results.push({ doc, score: similarity });
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  public static getStats(): {
    vectorCount: number,
    repoCounts: Map<string, number>,
    languageCounts: Map<string, number>
  } {
    const repoCounts = new Map<string, number>();
    const languageCounts = new Map<string, number>();
    
    for (const doc of vectorStore.values()) {
      if (doc.metadata.repoName) {
        repoCounts.set(doc.metadata.repoName, (repoCounts.get(doc.metadata.repoName) || 0) + 1);
      }
      if (doc.metadata.language) {
        languageCounts.set(doc.metadata.language, (languageCounts.get(doc.metadata.language) || 0) + 1);
      }
    }

    return { 
      vectorCount: vectorStore.size, 
      repoCounts, 
      languageCounts 
    };
  }
  
  public static clear(): void {
    vectorStore.clear();
  }
}

/**
 * Service responsible for high-level RAG operations (chunking, embedding, retrieval).
 */
class RAGService {
  private embeddingService = EmbeddingService.getInstance();

  private chunkText(text: string, maxChunkSize: number = CONFIG.EMBEDDING_CHUNK_SIZE): string[] {
    const chunks: string[] = [];
    // Use a slightly more robust splitting mechanism (splitting by sentences/newlines)
    const separators = /[.!?\n]+/g;
    const parts = text.split(separators);
    
    let currentChunk = '';
    
    for (const part of parts) {
        const sentence = part.trim();
        if (!sentence) continue;
        
        if (currentChunk.length + sentence.length + 2 > maxChunkSize) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence + '. ';
        } else {
            currentChunk += sentence + '. ';
        }
    }
    
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  public async ragRetrieval(query: string): Promise<RetrievalResult> {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    
    const similarDocs = VectorDBService.searchSimilar(queryEmbedding, CONFIG.SEARCH_LIMIT);
    
    const context: string[] = [];
    const sources: RetrievalResult['sources'] = [];
    
    // Using Set to deduplicate sources based on repo/path
    const uniqueSources = new Map<string, RetrievalResult['sources'][0]>();
    
    for (const { doc, score } of similarDocs) {
      context.push(doc.text);
      
      if (doc.metadata.repoName && doc.metadata.fileName) {
        const key = `${doc.metadata.repoName}:${doc.metadata.filePath}`;
        
        if (!uniqueSources.has(key) || uniqueSources.get(key)!.relevance < score) {
            uniqueSources.set(key, {
                repoName: doc.metadata.repoName,
                filePath: doc.metadata.filePath || 'unknown',
                fileName: doc.metadata.fileName,
                relevance: score
            });
        }
      }
    }
    
    return { context, sources: Array.from(uniqueSources.values()) };
  }

  public async addVectorsFromScrapedData(): Promise<number> {
    let addedCount = 0;
    
    try {
      const response = await fetch(CONFIG.SCRAPER_API_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch scraped data: ${response.statusText}`);
      }
      const data = await response.json();
      
      const repos = data.repos || [];
      let vectorIdCounter = 0;
      
      for (const repo of repos) {
        if (!repo.readme) continue;
        
        const chunks = this.chunkText(repo.readme);
        
        for (const chunk of chunks) {
          try {
            const embedding = await this.embeddingService.generateEmbedding(chunk);
            
            const vectorDoc: VectorDoc = {
              id: `${repo.full_name}-${vectorIdCounter++}`,
              text: chunk,
              embedding,
              metadata: {
                repoId: repo.id,
                repoName: repo.name,
                filePath: '',
                fileName: 'README.md',
                type: 'documentation',
                language: repo.language ? repo.language.toLowerCase() : 'unknown'
              },
              createdAt: new Date()
            };
            
            vectorStore.set(vectorDoc.id, vectorDoc);
            addedCount++;
          } catch (embedError) {
            console.warn(`Skipping chunk for ${repo.name} due to embedding failure.`);
            // Continue processing other chunks/repos
          }
        }
      }
      
      return addedCount;
    } catch (error) {
      console.error('Error in addVectorsFromScrapedData:', error);
      throw new Error('Failed to process scraped data.');
    }
  }
}

/**
 * Service dedicated to rendering the CLI menus.
 */
class CLIService {
  private static MENUS = {
    main: `
╔══════════════════════════════════════════════════════════════╗
║     ████╗██████╗███████╗███████╗███████╗███████╗    ║
║     ... (ASCII Art omitted for brevity) ...                  ║
║           VECTOR DATABASE & RAG SERVICE v1.0              ║
╠══════════════════════════════════════════════════════════╣
║  SELECT MODE:                                              ║
║  [1] 🧠 EMBED SCRAPED DATA                                 ║
║  [2] 🔍 RAG SEARCH                                        ║
║  [3] 📊 STATISTICS                                         ║
║  [4] 🗑️ CLEAR DATABASE                                      ║
║  [5] 🔙 BACK TO MAIN SCRAPER                             ║
╚══════════════════════════════════════════════════════════════╝
> `,
    
    embedding: `
╔══════════════════════════════════════════════════════════════╗
║               EMBEDDING MODE                                ║
╠════════════════════════════════════════════════════════════╣
║  🧠 GENERATING EMBEDDINGS...                              ║
║  Fetching scraped repositories...                             ║
║  Generating embeddings with OpenAI...                         ║
║  Storing in vector database...                                ║
╚════════════════════════════════════════════════════════════════╝
> `,

    ragSearch: `
╔════════════════════════════════════════════════════════════════╗
║               RAG SEARCH MODE                             ║
╠══════════════════════════════════════════════════════════════╣
║  🔍 ENTER YOUR QUERY:                                   ║
║  [ESC] Return to Main Menu | [ENTER] Search                 ║
╚════════════════════════════════════════════════════════╝
> `,
  };

  public static showMenu(session: Session, menuKey: keyof typeof CLIService['MENUS']) {
    session.mode = menuKey === 'ragSearch' ? 'searching' : 'menu';
    session.currentOperation = null;
    session.socket.emit('cli-clear');
    session.socket.emit('cli-output', CLIService.MENUS[menuKey]);
  }

  public static updateStatisticsMenu(session: Session) {
    const { vectorCount, repoCounts, languageCounts } = VectorDBService.getStats();
    
    const topRepos = [...repoCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
      
    const topLangs = [...languageCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const totalTime = session.stats.totalRetrievalTime;
    const queries = session.stats.searchQueries;
    const averageTime = queries > 0 ? (totalTime / queries).toFixed(1) : '0';

    const menu = `
╔══════════════════════════════════════════════════════════════╗
║               VECTOR DATABASE STATISTICS                     ║
╠════════════════════════════════════════════════════════════╣
║  📊 OVERALL METRICS                                        ║
║  Total Vectors: ${vectorCount.toLocaleString()}            
║  Total Documents: ${vectorCount.toLocaleString()}           
║  Total Search Queries: ${queries.toLocaleString()}          
║  Average Search Time: ${averageTime}ms                     
║                                                               
║  📂 TOP REPOSITORIES BY VECTORS                      
${topRepos.map((repo, i) => `║  [${i+1}] ${repo[0]}: ${repo[1].toLocaleString()} vectors`).join('\n')}
${topRepos.length === 0 ? '║  No repositories indexed yet.' : ''}
                                                               
║  🌐 TOP LANGUAGES                                         
${topLangs.map((lang, i) => `║  [${i+1}] ${lang[0].charAt(0).toUpperCase() + lang[0].slice(1)}: ${lang[1].toLocaleString()} vectors`).join('\n')}
${topLangs.length === 0 ? '║  No languages indexed yet.' : ''}
                                                               
║  [1] 🗑️ CLEAR DATABASE                                      
║  [2] 🔙 BACK TO MAIN MENU                                     
╚════════════════════════════════════════════════════════════════╝
> `;
    
    session.socket.emit('cli-clear');
    session.socket.emit('cli-output', menu, true);
  }
}


// --- 5. APPLICATION LOGIC (CONTROLLERS) ---

const ragService = new RAGService();

async function embedScrapedData(session: Session) {
  session.mode = 'processing';
  session.currentOperation = 'Embedding scraped data';
  CLIService.showMenu(session, 'embedding');
  
  try {
    const addedCount = await ragService.addVectorsFromScrapedData();
    
    // Update session stats
    session.stats.totalVectors = vectorStore.size;
    
    CLIService.showMenu(session, 'main');
    session.socket.emit('cli-output', `\n✓ Successfully embedded ${addedCount} document chunks.\n`);
    session.socket.emit('cli-output', `Total vectors in database: ${vectorStore.size.toLocaleString()}.\n`);

  } catch (error) {
    console.error('Error embedding data:', error);
    session.socket.emit('cli-output', `\n❌ Embedding failed: ${(error as Error).message}\n`);
    CLIService.showMenu(session, 'main');
  }
}

async function handleRagSearch(session: Session, query: string) {
  session.mode = 'processing';
  session.currentOperation = 'Searching RAG database';
  
  const startTime = performance.now();
  
  session.socket.emit('cli-clear');
  session.socket.emit('cli-output', `\n🔍 Performing RAG search...\n`);
  session.socket.emit('cli-output', `Query: "${query}"\n`);
  
  try {
    const { context, sources } = await ragService.ragRetrieval(query);
    
    const elapsed = performance.now() - startTime;
    
    // Update stats
    session.stats.searchQueries++;
    session.stats.totalRetrievalTime += elapsed;
    
    // Display results
    session.socket.emit('cli-output', `\n✓ Found ${sources.length} relevant sources (Time: ${elapsed.toFixed(2)}ms)\n`);
    
    if (context.length > 0) {
      session.socket.emit('cli-output', `\n📝 RELEVANT CONTEXT SNIPPETS:\n`);
      session.socket.emit('cli-output', '─'.repeat(50) + '\n');
      
      context.forEach((ctx, index) => {
        const snippet = ctx.substring(0, 150);
        session.socket.emit('cli-output', `[${index + 1}] ${snippet}${ctx.length > 150 ? '...' : ''}\n`);
      });
      
      session.socket.emit('cli-output', '\n' + '─'.repeat(50) + '\n');
    }
    
    if (sources.length > 0) {
      session.socket.emit('cli-output', `\n📂 SOURCE REPOSITORIES:\n`);
      
      sources.forEach((source, index) => {
        session.socket.emit('cli-output', `\n[${index + 1}] ${source.repoName}/${source.fileName}`);
        session.socket.emit('cli-output', `    Path: ${source.filePath}`);
        session.socket.emit('cli-output', `    Relevance: ${(source.relevance * 100).toFixed(1)}%`);
      });
    }
    
  } catch (error) {
    session.socket.emit('cli-output', `\n❌ Search Error: ${(error as Error).message}\n`);
  }
  
  // Return to search prompt
  session.mode = 'searching';
  session.socket.emit('cli-output', `\n${'='.repeat(50)}\n`);
  session.socket.emit('cli-output', `\n[ENTER] Search again | [ESC] Return to Menu\n`);
}

function handleClearDatabase(session: Session) {
  VectorDBService.clear();
  session.stats = { totalVectors: 0, searchQueries: 0, totalRetrievalTime: 0 };
  
  session.socket.emit('cli-clear');
  session.socket.emit('cli-output', `\n🗑️ Database cleared. All ${vectorStore.size} vectors removed.\n`);
  CLIService.showMenu(session, 'main');
}

// --- 6. SOCKET HANDLER ---

const handleConnection = (socket: Socket) => {
  console.log(`Vector DB client connected: ${socket.id}`);
  
  const session: Session = {
    socket,
    mode: 'menu',
    stats: {
      totalVectors: vectorStore.size,
      searchQueries: 0,
      totalRetrievalTime: 0
    },
    currentOperation: null
  };
  
  sessions.set(socket.id, session);
  
  socket.emit('cli-clear');
  CLIService.showMenu(session, 'main');
  
  socket.on('vector-input', async (data: { input: string }) => {
    const input = data.input?.trim();
    const command = input?.toLowerCase();
    
    if (!command) return;

    if (session.mode === 'menu') {
      if (command === '1' || command === 'embed') {
        await embedScrapedData(session);
      } else if (command === '2' || command === 'search') {
        CLIService.showMenu(session, 'ragSearch');
      } else if (command === '3' || command === 'stats') {
        CLIService.updateStatisticsMenu(session);
        session.mode = 'menu'; // Remain in menu mode after showing stats
      } else if (command === '4' || command === 'clear') {
        handleClearDatabase(session);
      } else if (command === '5' || command === 'back') {
        socket.emit('cli-switch-mode', { mode: 'scraper' });
      } else if (command === 'help' || command === '?') {
        // Render detailed help message (omitted for brevity, assume CLIService handles this)
      } else if (command === 'exit') {
        socket.emit('cli-exit');
      }
    } else if (session.mode === 'searching') {
      if (command === 'esc') {
        CLIService.showMenu(session, 'main');
      } else if (input.length > 0) {
        await handleRagSearch(session, input);
      }
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`Vector DB client disconnected: ${socket.id}`);
    sessions.delete(socket.id);
  });
};

// --- 7. SERVER SETUP ---

const httpServer: HttpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: CONFIG.CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});

io.on('connection', handleConnection);

// --- 8. STARTUP ---

async function startServer() {
  console.log(`Attempting to initialize Embedding Service...`);
  const embedReady = await EmbeddingService.getInstance().initialize();

  if (!embedReady) {
      console.warn("⚠️ Warning: OpenAI key missing or initialization failed. Embedding functionality will not work until configured.");
  }
  
  httpServer.listen(CONFIG.PORT, () => {
    console.log(`╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║   🧠 VECTOR DB STARTED ON PORT ${CONFIG.PORT}                  ║`);
    console.log(`║   RAG Service Ready                                          ║`);
    console.log(`║   In-memory vectors: ${vectorStore.size}                     ║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝`);
  });
}

startServer();