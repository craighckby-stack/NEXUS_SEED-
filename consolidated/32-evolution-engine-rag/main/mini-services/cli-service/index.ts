// Import necessary modules
import { Server, Socket } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';
import fetch, { Response } from 'node-fetch';

// Define constants
enum Port {
  NUMBER = 3001,
}

enum BackendApiUrl {
  VALUE = 'http://localhost:3000/api',
}

// Define types
enum MenuKey {
  MAIN = 'main',
  CONFIGURE = 'configure',
  SEARCH = 'search',
  BUILD = 'build',
  AGI = 'agi',
}

enum CLIMode {
  MENU = 'menu',
  INPUT = 'input',
  SEARCH = 'search',
  BUILD = 'build',
  AGI = 'agi',
}

interface CLISession {
  socket: Socket;
  mode: CLIMode;
  menuStack: MenuKey[];
  currentMenu: MenuKey;
  userData: any;
  projectData: any;
}

interface ProjectType {
  id: string;
  name: string;
  emoji: string;
}

// Initialize server and socket
const httpServer: HttpServer = createServer();
const io: Server = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const sessions = new Map<string, CLISession>();

// Define menu definitions
const MENUS: Record<MenuKey, string> = {
  [MenuKey.MAIN]: `
╔════════════════════════════════════════════════════════════╗
║              EVOLUTION ENGINE - CLI INTERFACE v1.0              ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  Select an option (1-5):                                    ║
║                                                               ║
║  [1] 🚀 Create New Project                                    ║
║  [2] 🔍 Search for AGI Concepts / Repos                      ║
║  [3] ⚙️  Configure Settings                                     ║
║  [4] 🤖 Create AGI System                                    ║
║  [5] ❓ Help - List All Options                               ║
║                                                               ║
╚════════════════════════════════════════════════════════════╝

> `,
  
  [MenuKey.CONFIGURE]: `
╔════════════════════════════════════════════════════════════╗
║                   CONFIGURATION MENU                                 ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  Select an option (1-6):                                    ║
║                                                               ║
║  [1] 👤 User Profile Information                               ║
║  [2] 🔑 API Keys (GitHub, Gemini)                             ║
║  [3] 📦 GitHub Repository Settings                            ║
║  [4] 🎨 Technology Stack Preferences                          ║
║  [5] 📊 Experience Level                                      ║
║  [6] 🔙 Back to Main Menu                                     ║
║                                                               ║
╚════════════════════════════════════════════════════════════╝

> `,
  
  [MenuKey.SEARCH]: `
╔════════════════════════════════════════════════════════════╗
║                      SEARCH MENU                                  ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  Select an option (1-5):                                    ║
║                                                               ║
║  [1] 🌐 Search AGI Concepts (Google)                         ║
║  [2] 📚 Search GitHub Repositories                             ║
║  [3] 🔗 Search Your Repositories                               ║
║  [4] 📋 View Found Repositories                              ║
║  [5] 🔙 Back to Main Menu                                   ║
║                                                               ║
╚════════════════════════════════════════════════════════════╝

> `,
  
  [MenuKey.BUILD]: `
╔════════════════════════════════════════════════════════════╗
║                      BUILD MENU                                    ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  Select an option (1-6):                                    ║
║                                                               ║
║  [1] 📋 View Build Instructions                               ║
║  [2] ▶️  Start Building Project                               ║
║  [3] 📊 View Project Status                                  ║
║  [4] 📝 View Upload Files                                   ║
║  [5] 🔄 Reset Project                                       ║
║  [6] 🔙 Back to Main Menu                                   ║
║                                                               ║
╚════════════════════════════════════════════════════════════╝

> `,
  
  [MenuKey.AGI]: `
╔════════════════════════════════════════════════════════════╗
║                     CREATE AGI SYSTEM                              ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  This will search, aggregate, and create a complete AGI system    ║
║  from relevant GitHub repositories.                                  ║
║                                                               ║
║  Select an option (1-4):                                    ║
║                                                               ║
║  [1] 🔍 Find AGI-Related Repositories                         ║
║  [2] 📦 Aggregate Selected Repositories                        ║
║  [3] 🚀 Generate AGI Build Instructions                     ║
║  [4] 🔙 Back to Main Menu                                   ║
║                                                               ║
╚════════════════════════════════════════════════════════════╝

> `
};

// Define help text
const HELP_TEXT: string = `
╔════════════════════════════════════════════════════════════╗
║                        COMMAND HELP                               ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  AVAILABLE COMMANDS:                                           ║
║  ───────────────────────────────────────────────────────────────    ║
║                                                               ║
║  help, ?          Show this help screen                         ║
║  menu             Return to main menu                           ║
║  clear            Clear the screen                               ║
║  status           Show current system status                      ║
║  reset            Reset the entire system                         ║
║  exit             Exit CLI (returns to web UI)                  ║
║                                                               ║
║  NAVIGATION:                                                   ║
║  ───────────                                                  ║
║  1-5              Select menu option by number                  ║
║  1-6              Select submenu option by number                ║
║  ESC               Return to previous menu                     ║
║  Tab               Auto-complete commands                       ║
║                                                               ║
║  PROJECT WORKFLOW:                                             ║
║  ─────────────────                                        ║
║                                                               ║
║  1. Select [1] Create New Project                           ║
║  2. Choose project type (Quantum OS, Book Writer, etc.)    ║
║  3. Describe your project                                      ║
║  4. Upload relevant files (.bin, .pdf, .json, .zip)        ║
║  5. System searches GitHub for relevant repositories            ║
║  6. AI generates build instructions                         ║
║  7. Start building project                                    ║
║                                                               ║
║  AGI CREATION WORKFLOW:                                        ║
║  ────────────────────────                                    ║
║                                                               ║
║  1. Select [4] Create AGI System                            ║
║  2. Search for AGI concepts and repositories                 ║
║  3. Select repositories to aggregate                         ║
║  4. System combines them into one AGI system               ║
║  5. Generate complete build instructions                     ║
║                                                               ║
║  CONFIGURATION:                                                ║
║  ─────────────                                            ║
║                                                               ║
║  • User Profile: Name, email, company, role                  ║
║  • API Keys: GitHub token, Gemini API key                      ║
║  • GitHub Repo: Name of your learning repository               ║
║  • Tech Stack: Preferred technologies                         ║
║  • Experience: Beginner, Intermediate, Expert                   ║
║                                                               ║
╚════════════════════════════════════════════════════════════╝

Press any key to continue...
> `;

// Define project types
const PROJECT_TYPES: ProjectType[] = [
  { id: 'quantum-os', name: 'Quantum Operating System', emoji: '⚛️' },
  { id: 'book-writer', name: 'Book Writer Assistant', emoji: '📖' },
  { id: 'ai-chatbot', name: 'AI Chatbot System', emoji: '🤖' },
  { id: 'e-commerce', name: 'E-commerce Platform', emoji: '🛒' },
  { id: 'dashboard', name: 'Analytics Dashboard', emoji: '📊' },
  { id: 'custom', name: 'Custom Project', emoji: '🔧' }
];

// Define utility functions
function createSession(socket: Socket): CLISession {
  return {
    socket,
    mode: CLIMode.MENU,
    menuStack: [],
    currentMenu: MenuKey.MAIN,
    userData: null,
    projectData: null
  };
}

function sendToCLI(session: CLISession, text: string, clear: boolean = false) {
  if (clear) {
    session.socket.emit('cli-clear');
  }
  session.socket.emit('cli-output', text);
}

function showMenu(session: CLISession) {
  const menu = MENUS[session.currentMenu];
  if (menu) {
    sendToCLI(session, menu, true);
  } else {
    session.currentMenu = MenuKey.MAIN;
    sendToCLI(session, MENUS[MenuKey.MAIN], true);
  }
}

async function handleTextInput(session: CLISession, input: string) {
  const trimmedInput = input.trim().toLowerCase();
  
  if (session.mode === CLIMode.INPUT) {
    if (input === 'confirm') {
      await performReset(session);
    } else if (input === 'cancel') {
      session.mode = CLIMode.MENU;
      showMenu(session);
    } else if (session.projectData?.action === 'search-github') {
      await searchGitHubRepos(session, input);
    } else if (session.projectData?.action === 'project-type') {
      await handleProjectTypeSelection(session, input);
    } else if (session.projectData?.action === 'project-name') {
      session.projectData.name = input;
      sendToCLI(session, '\nDescribe your project:');
      session.projectData.action = 'project-description';
    } else if (session.projectData?.action === 'project-description') {
      session.projectData.description = input;
      sendToCLI(session, '\n📂 Enter tech stack (comma separated, or press Enter to skip):');
      session.projectData.action = 'project-stack';
    } else if (session.projectData?.action === 'project-stack') {
      session.projectData.techStack = input;
      await submitProject(session);
    } else if (session.projectData?.action === 'upload-files') {
        if (input.toLowerCase() === 'y' || input.toLowerCase() === 'n') {
            sendToCLI(session, `\nFile upload step processed for input: ${input}. Moving to next step.`);
            session.mode = CLIMode.MENU;
            showMenu(session);
        } else {
            sendToCLI(session, '\n❌ Invalid response for file upload. (Y/N or Enter to skip)');
            sendToCLI(session, '> ');
        }
    } else if (session.projectData?.action === 'aggregate-select') {
        await processAggregateSelection(session, input);
    }
  }
}

async function processAggregateSelection(session: CLISession, input: string) {
    if (input.toLowerCase() === 'all') {
        sendToCLI(session, '\nAggregating all found repositories...');
        // Assume aggregation logic here
    } else {
        const indices = input.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
        if (indices.length > 0) {
             sendToCLI(session, `\nAggregating selected repositories: ${indices.join(', ')}...`);
            // Assume aggregation logic for specific indices here
        } else {
            sendToCLI(session, '\n❌ Invalid selection. Please enter comma-separated numbers or "all".');
            sendToCLI(session, '> ');
            return;
        }
    }
    
    session.mode = CLIMode.MENU;
    sendToCLI(session, '\nAggregation initiated.');
    showMenu(session);
}

async function handleProjectTypeSelection(session: CLISession, input: string) {
    const selection = parseInt(input.trim());
    let typeId: string | null = null;
    
    if (selection >= 1 && selection <= PROJECT_TYPES.length) {
        typeId = PROJECT_TYPES[selection - 1].id;
    } else if (selection === 7) {
        typeId = 'custom';
    }

    if (typeId) {
        session.projectData = {
            ...session.projectData,
            typeId: typeId,
            typeName: typeId === 'custom' ? 'Custom Project' : PROJECT_TYPES.find(t => t.id === typeId)?.name || 'Custom',
        };
        sendToCLI(session, `\nSelected Project Type: ${session.projectData.typeName}`);
        sendToCLI(session, 'Enter Project Name:');
        session.projectData.action = 'project-name';
    } else {
        sendToCLI(session, '\n❌ Invalid option. Please enter 1-7.');
        sendToCLI(session, '> ');
    }
}

async function handleMenuSelection(session: CLISession, selection: number) {
  const handlerMap: Record<MenuKey, (s: CLISession, sel: number) => Promise<void>> = {
    [MenuKey.MAIN]: handleMainMenu,
    [MenuKey.CONFIGURE]: handleConfigureMenu,
    [MenuKey.SEARCH]: handleSearchMenu,
    [MenuKey.BUILD]: handleBuildMenu,
    [MenuKey.AGI]: handleAGIMenu,
  };

  const handler = handlerMap[session.currentMenu];
  if (handler) {
    await handler(session, selection);
  }
}

// Define input/command handling
async function handleInput(session: CLISession, input: string) {
  const trimmedInput = input.trim().toLowerCase();
  
  if (session.mode === CLIMode.INPUT && (trimmedInput === 'confirm' || trimmedInput === 'cancel')) {
    await handleTextInput(session, input);
    return;
  }

  if (trimmedInput === 'help' || trimmedInput === '?') {
    sendToCLI(session, HELP_TEXT, true);
    return;
  }
  
  if (trimmedInput === 'menu') {
    session.currentMenu = MenuKey.MAIN;
    session.mode = CLIMode.MENU;
    showMenu(session);
    return;
  }
  
  if (trimmedInput === 'clear') {
    sendToCLI(session, '', true);
    showMenu(session);
    return;
  }
  
  if (trimmedInput === 'status') {
    await showStatus(session);
    return;
  }
  
  if (trimmedInput === 'reset') {
    sendToCLI(session, '\n⚠️  Resetting system... This will clear all data.');
    sendToCLI(session, 'Type "confirm" to proceed or "cancel" to abort.');
    session.mode = CLIMode.INPUT; 
    return;
  }
  
  if (trimmedInput === 'exit') {
    sendToCLI(session, '\n👋 Returning to web interface...');
    session.socket.emit('cli-exit');
    return;
  }
  
  if (session.mode === CLIMode.INPUT) {
    await handleTextInput(session, input);
    return;
  }
  
  if (session.mode === CLIMode.MENU) {
    const selection = parseInt(trimmedInput);
    if (!isNaN(selection) && selection >= 1 && selection <= 6) {
      await handleMenuSelection(session, selection);
    } else {
      sendToCLI(session, '\n❌ Invalid selection. Please enter a command or a menu number (1-5/6).');
      sendToCLI(session, '> ');
    }
  }
}

// Define menu dispatchers
async function handleMainMenu(session: CLISession, selection: number) {
  switch (selection) {
    case 1:
      await createProject(session);
      break;
    case 2:
      session.currentMenu = MenuKey.SEARCH;
      showMenu(session);
      break;
    case 3:
      session.currentMenu = MenuKey.CONFIGURE;
      showMenu(session);
      break;
    case 4:
      session.currentMenu = MenuKey.AGI;
      showMenu(session);
      break;
    case 5:
      sendToCLI(session, HELP_TEXT, true);
      break;
    default:
      sendToCLI(session, '\n❌ Invalid option. Please enter 1-5.');
      showMenu(session);
  }
}

async function handleConfigureMenu(session: CLISession, selection: number) {
  switch (selection) {
    case 1:
      sendToCLI(session, '\n👤 Current User Profile:');
      await fetchAndDisplayUser(session);
      break;
    case 2:
      sendToCLI(session, '\n🔑 API Keys:');
      await fetchAndDisplayKeys(session);
      break;
    case 3:
      sendToCLI(session, '\n📦 GitHub Repository:');
      await fetchAndDisplayRepo(session);
      break;
    case 4:
      sendToCLI(session, '\n🎨 Current Tech Stack:');
      await fetchAndDisplayStack(session);
      break;
    case 5:
      sendToCLI(session, '\n📊 Experience Level:');
      await fetchAndDisplayExperience(session);
      break;
    case 6:
      session.currentMenu = MenuKey.MAIN;
      showMenu(session);
      break;
    default:
      sendToCLI(session, '\n❌ Invalid option. Please enter 1-6.');
      showMenu(session);
  }
}

async function handleSearchMenu(session: CLISession, selection: number) {
  switch (selection) {
    case 1:
      sendToCLI(session, '\n🌐 Searching for AGI concepts...');
      await searchAGIConcepts(session);
      break;
    case 2:
      sendToCLI(session, '\n📚 Enter search query for GitHub:');
      session.mode = CLIMode.INPUT;
      session.projectData = { action: 'search-github' };
      break;
    case 3:
      sendToCLI(session, '\n🔗 Your repositories:');
      await fetchUserRepos(session);
      break;
    case 4:
      sendToCLI(session, '\n📋 Found Repositories:');
      await displayFoundRepos(session);
      break;
    case 5:
      session.currentMenu = MenuKey.MAIN;
      showMenu(session);
      break;
    default:
      sendToCLI(session, '\n❌ Invalid option. Please enter 1-5.');
      showMenu(session);
  }
}

async function handleBuildMenu(session: CLISession, selection: number) {
  switch (selection) {
    case 1:
      sendToCLI(session, '\n📋 Build Instructions:');
      await displayBuildInstructions(session);
      break;
    case 2:
      sendToCLI(session, '\n▶️  Starting build process...');
      await startBuild(session);
      break;
    case 3:
      sendToCLI(session, '\n📊 Project Status:');
      await displayProjectStatus(session);
      break;
    case 4:
      sendToCLI(session, '\n📝 Uploaded Files:');
      await displayUploadedFiles(session);
      break;
    case 5:
      sendToCLI(session, '\n⚠️  Resetting project...');
      await resetProject(session);
      break;
    case 6:
      session.currentMenu = MenuKey.MAIN;
      showMenu(session);
      break;
    default:
      sendToCLI(session, '\n❌ Invalid option. Please enter 1-6.');
      showMenu(session);
  }
}

async function handleAGIMenu(session: CLISession, selection: number) {
  switch (selection) {
    case 1:
      sendToCLI(session, '\n🔍 Searching for AGI-related repositories...');
      await searchAGIRepos(session);
      break;
    case 2:
      sendToCLI(session, '\n📦 Select repositories to aggregate:');
      await aggregateRepos(session);
      break;
    case 3:
      sendToCLI(session, '\n🚀 Generating AGI build instructions...');
      await generateAGIBuild(session);
      break;
    case 4:
      session.currentMenu = MenuKey.MAIN;
      showMenu(session);
      break;
    default:
      sendToCLI(session, '\n❌ Invalid option. Please enter 1-4.');
      showMenu(session);
  }
}

// Define workflow handlers
async function createProject(session: CLISession) {
  sendToCLI(session, '\n\n╔════════════════════════════════════════════════════════════╗');
  sendToCLI(session, '║                    CREATE NEW PROJECT                          ║');
  sendToCLI(session, '╠══════════════════════════════════════════════════════════╣\n');
  
  sendToCLI(session, 'Select project type:');
  PROJECT_TYPES.forEach((type, index) => {
    sendToCLI(session, `  [${index + 1}] ${type.emoji} ${type.name}`);
  });
  sendToCLI(session, `  [${PROJECT_TYPES.length + 1}] 🔧 Custom Project\n`);
  
  session.mode = CLIMode.INPUT;
  session.projectData = { action: 'project-type' };
  sendToCLI(session, '> ');
}

async function submitProject(session: CLISession) {
  sendToCLI(session, '\nFiles description gathered.');
  sendToCLI(session, '📂 Uploading files? (Y/N, or press Enter to skip):');
  session.mode = CLIMode.INPUT;
  session.projectData.action = 'upload-files';
  sendToCLI(session, '> ');
}

// Define API & status helpers
async function safeFetch<T>(url: string, options?: any): Promise<T | null> {
    try {
        const response: Response = await fetch(`${BackendApiUrl.VALUE}${url}`, options);
        if (!response.ok) {
            console.error(`API Error ${response.status} for ${url}`);
            return null;
        }
        return await response.json() as T;
    } catch (error) {
        console.error(`Fetch failed for ${url}:`, error);
        return null;
    }
}

async function fetchAndDisplayUser(session: CLISession) {
  const data = await safeFetch<{ user: { name: string, email: string, githubUsername: string, experienceLevel: string } | null }>('/onboarding/status');
  
  if (data?.user) {
    sendToCLI(session, `  Name: ${data.user.name}`);
    sendToCLI(session, `  Email: ${data.user.email}`);
    sendToCLI(session, `  GitHub: ${data.user.githubUsername}`);
    sendToCLI(session, `  Experience: ${data.user.experienceLevel}`);
  } else {
    sendToCLI(session, '  ⚠️ No user profile found. Complete onboarding first.');
  }
  sendToCLI(session, '\n> ');
}

async function fetchAndDisplayKeys(session: CLISession) {
  const data = await safeFetch<{ githubToken: string, geminiApiKey: string }>('/evolution/config');
  
  if (data) {
    sendToCLI(session, `  GitHub Token: ${data.githubToken ? '✓ Configured' : '✗ Not configured'}`);
    sendToCLI(session, `  Gemini API Key: ${data.geminiApiKey ? '✓ Configured' : '✗ Not configured'}`);
  } else {
    sendToCLI(session, '  ❌ Failed to fetch API keys.');
  }
  sendToCLI(session, '\n> ');
}

async function fetchAndDisplayRepo(session: CLISession) {
  const data = await safeFetch<{ githubRepo: string }>('/evolution/config');
  
  if (data?.githubRepo) {
    sendToCLI(session, `  Repository: ${data.githubRepo}`);
  } else {
    sendToCLI(session, '  ⚠️ No repository configured.');
  }
  sendToCLI(session, '\n> ');
}

async function fetchAndDisplayStack(session: CLISession) {
  const statusData = await safeFetch<{ user: { id: number } | null }>('/onboarding/status');
  
  if (statusData?.user) {
    const userData = await safeFetch<{ techStack: string | null }>(`/user/${statusData.user.id}`);
    
    if (userData?.techStack) {
      try {
        const stack = JSON.parse(userData.techStack);
        sendToCLI(session, `  Technologies: ${Array.isArray(stack) ? stack.join(', ') : userData.techStack}`);
      } catch {
        sendToCLI(session, `  Technologies: ${userData.techStack}`);
      }
    } else {
      sendToCLI(session, '  No tech stack configured.');
    }
  } else {
    sendToCLI(session, '  ❌ Failed to fetch user data.');
  }
  sendToCLI(session, '\n> ');
}

async function fetchAndDisplayExperience(session: CLISession) {
  const statusData = await safeFetch<{ user: { id: number } | null }>('/onboarding/status');
  
  if (statusData?.user) {
    const userData = await safeFetch<{ experienceLevel: string | null }>(`/user/${statusData.user.id}`);
    
    if (userData?.experienceLevel) {
      sendToCLI(session, `  Experience Level: ${userData.experienceLevel}`);
    } else {
      sendToCLI(session, '  No experience level configured.');
    }
  } else {
    sendToCLI(session,