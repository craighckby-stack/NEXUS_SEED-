// mini-services/cli-service/deploy-mode.ts

import { execSync } from 'child_process';
import { CLISession } from './cli-types';
import { sendToCLI, showMenu } from './cli-ui-utils';

// --- Constants for Menu Display ---

const DEPLOY_MENU_TITLE = 'DEPLOY TO GITHUB';
const AUTHOR_NAME = 'Craig Huckerby';
const DEPLOYMENT_SCRIPT_COMMAND = 'bun run deplay.ts';
const BUILD_TEST_COMMAND = 'bun run build';

const DEPLOY_MENU_CONTENT = `
╔════════════════════════════════════════════════════════════════════╗
║                    ${DEPLOY_MENU_TITLE.padEnd(50)}║
╠════════════════════════════════════════════════════════════╣
║                                                               ║
║  This will deploy Evolution Engine + RAG + Scraper to a       ║
║  new GitHub repository with author attribution.               ║
║                                                               ║
║  Select an option (1-4):                                    ║
║                                                               ║
║  [1] 🚀 RUN DEPLOYMENT SCRIPT                            ║
║      Execute '${DEPLOYMENT_SCRIPT_COMMAND}' which will:          ║
║      • Create GitHub repo                              ║
║      • Upload ALL source files                         ║
║      • Run build tests                                  ║
║      • Set author to ${AUTHOR_NAME}                      ║
║      • Commit and push to GitHub                       ║
║                                                               ║
║  [2] 📝 VIEW DEPLOYMENT SETTINGS                      ║
║      Show repo name and description                   ║
║                                                               ║
║  [3] 🔍 TEST DEPLOYMENT ONLY                            ║
║      Run build tests without uploading                ║
║                                                               ║
║  [4] 🔙 BACK TO MAIN MENU                                     ║
║                                                               ║
╚════════════════════════════════════════════════════════════════════════╝

> `;

// --- Enum for Menu Options ---

enum DeployMenuOptions {
  RUN_DEPLOYMENT_SCRIPT = 1,
  VIEW_DEPLOYMENT_SETTINGS,
  TEST_DEPLOYMENT_ONLY,
  BACK_TO_MAIN_MENU,
}

// --- Handlers ---

async function handleDeployMenu(session: CLISession, selection: number) {
  switch (selection) {
    case DeployMenuOptions.RUN_DEPLOYMENT_SCRIPT:
      await runDeploymentScript(session);
      break;
    case DeployMenuOptions.VIEW_DEPLOYMENT_SETTINGS:
      await viewDeploymentSettings(session);
      break;
    case DeployMenuOptions.TEST_DEPLOYMENT_ONLY:
      await runBuildTestsOnly(session);
      break;
    case DeployMenuOptions.BACK_TO_MAIN_MENU:
      session.currentMenu = 'main';
      showMenu(session, 'main');
      break;
    default:
      sendToCLI(session, '\n❌ Invalid option. Please enter 1-4.');
      showMenu(session, 'deploy');
  }
}

async function runDeploymentScript(session: CLISession): Promise<void> {
  try {
    sendToCLI(session, '\n🚀 Running deployment script...\n');
    sendToCLI(session, `Executing: ${DEPLOYMENT_SCRIPT_COMMAND}\n`);
    execSync(DEPLOYMENT_SCRIPT_COMMAND, {
      encoding: 'utf-8',
      stdio: 'inherit',
      cwd: process.cwd()
    });
    sendToCLI(session, '\n✓ Deployment script completed successfully.\n');
    sendToCLI(session, 'Review output above for details.\n');
  } catch (error) {
    sendToCLI(session, `\n❌ Deployment script failed. See error details above.\n`);
  } finally {
    showMenu(session, 'deploy');
  }
}

async function viewDeploymentSettings(session: CLISession): Promise<void> {
  sendToCLI(session, '\nℹ️ Viewing Deployment Settings is not yet implemented.\n');
  showMenu(session, 'deploy');
}

async function runBuildTestsOnly(session: CLISession): Promise<void> {
  try {
    sendToCLI(session, '\n🧪 Running build tests only...\n');
    const result = execSync(BUILD_TEST_COMMAND, {
      encoding: 'utf-8',
      stdio: 'pipe', 
      maxBuffer: 10 * 1024 * 1024 
    });
    const output = result.toString();
    const errorIndicators = ['error', 'failed', 'missing'];
    const lines = output.split('\n');
    const errors = lines.filter(line => 
      errorIndicators.some(indicator => line.toLowerCase().includes(indicator))
    );
    const hasFailed = errors.length > 0;
    const displayLimit = 5;

    const summaryBox = `
╔════════════════════════════════════════════════════════════════════╗
║                    BUILD TEST RESULTS (Dry Run)                    ║
╠════════════════════════════════════════════════════════════╣
║                                                               ║
║  Status: ${hasFailed ? '✗ FAILED' : '✓ PASSED'}                       ║
║  Errors Found: ${errors.length}                                ║
║                                                               ║`;

    sendToCLI(session, summaryBox);

    if (hasFailed) {
      sendToCLI(session, `║  First ${Math.min(errors.length, displayLimit)} Errors:                       ║`);
      errors.slice(0, displayLimit).forEach((err, i) => {
        const truncatedErr = err.trim().substring(0, 56);
        sendToCLI(session, `║  [${i + 1}] ${truncatedErr.padEnd(56)} ║`);
      });
      if (errors.length > displayLimit) {
        sendToCLI(session, `║  ... and ${errors.length - displayLimit} more errors                   ║`);
      }
    } else {
      sendToCLI(session, `║  No critical errors detected - Build is clean!     ║`);
    }
    
    const footerBox = `
║                                                               ║
║  [4] 🔙 BACK TO DEPLOY MENU                                ║
║                                                               ║
╚════════════════════════════════════════════════════════════════════╝

> `;
    sendToCLI(session, footerBox);
  } catch (error) {
    sendToCLI(session, `\n❌ Build testing command failed execution: ${error instanceof Error ? error.message : String(error)}\n`);
  } finally {
    showMenu(session, 'deploy');
  }
}

export { DEPLOY_MENU_CONTENT, handleDeployMenu };