import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github';
import { sendToAI, shouldEnhanceFile, generateEnhancementSummary } from '@/lib/ai';
import { 
  applyRateLimit, 
  validateRepoParams, 
  handleApiError, 
  createSuccessResponse 
} from '@/lib/api-middleware';

// Enhanced type definitions
interface EnhancementStats {
  enhanced: number;
  skipped: number;
  unchanged: number;
  errors: number;
  total: number;
}

interface FileProcessingResult {
  path: string;
  enhanced: boolean;
  reason?: string;
  status: string;
  beforeSize?: number;
  afterSize?: number;
}

interface SSEMessage {
  type: 'info' | 'success' | 'error' | 'stats' | 'complete' | 'progress';
  message?: string;
  stats?: EnhancementStats;
  newBranch?: string;
  summary?: string;
  progress?: {
    current: number;
    total: number;
    file?: string;
  };
}

// Constants for better maintainability
const BINARY_EXTENSIONS = /\.(jpg|jpeg|png|gif|svg|ico|pdf|zip|tar|gz|exe|dll|so|dylib|woff|woff2|ttf|eot|mp3|mp4|avi|mov)$/i;
const MAX_FILE_SIZE = 100000; // 100KB
const MAX_CONSECUTIVE_ERRORS = 3;
const BATCH_SIZE = 10;
const SSE_KEEPALIVE_INTERVAL = 30000; // 30 seconds

/**
 * Enhanced SSE message helper with better error handling
 */
function sendSSEMessage(controller: ReadableStreamDefaultController, data: SSEMessage): boolean {
  try {
    // Check if controller is still open
    if (!controller || controller.desiredSize === 0) {
      return false;
    }
    
    const message = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(message));
    return true;
  } catch (error) {
    console.error('Error sending SSE message:', error);
    // Don't try to send error message recursively to avoid infinite loops
    return false;
  }
}

/**
 * Safe SSE message sender that handles controller state
 */
function safeSendSSE(controller: ReadableStreamDefaultController, data: SSEMessage): void {
  if (!sendSSEMessage(controller, data)) {
    // Controller is closed, stop processing
    return;
  }
}

/**
 * Enhanced file processing with comprehensive error handling
 */
async function enhanceAndPushFile(
  githubService: GitHubService,
  file: { path: string; sha: string; size?: number },
  controller: ReadableStreamDefaultController
): Promise<FileProcessingResult> {
  try {
    // Enhanced file filtering with better validation
    if (BINARY_EXTENSIONS.test(file.path)) {
      const result: FileProcessingResult = { 
        path: file.path, 
        enhanced: false, 
        reason: 'Binary file skipped',
        status: 'skipped'
      };
      safeSendSSE(controller, {
        type: 'info',
        message: `⊘ Skipped ${file.path}: ${result.reason}`
      });
      return result;
    }

    // Enhanced file size validation
    if (file.size && file.size > MAX_FILE_SIZE) {
      const result: FileProcessingResult = { 
        path: file.path, 
        enhanced: false, 
        reason: `File too large (${(file.size/1024).toFixed(2)}KB)`,
        status: 'skipped'
      };
      safeSendSSE(controller, {
        type: 'info',
        message: `⊘ Skipped ${file.path}: ${result.reason}`
      });
      return result;
    }

    // Enhanced file content retrieval with better error handling
    let fileContent;
    try {
      fileContent = await githubService.getFileContent(file.path);
    } catch (error) {
      const result: FileProcessingResult = { 
        path: file.path, 
        enhanced: false, 
        reason: error instanceof Error ? error.message : 'Failed to retrieve file content',
        status: 'error'
      };
      safeSendSSE(controller, {
        type: 'error',
        message: `✗ Failed to retrieve ${file.path}: ${result.reason}`
      });
      return result;
    }

    // Enhanced empty file handling
    if (!fileContent.content.trim()) {
      const result: FileProcessingResult = { 
        path: file.path, 
        enhanced: false, 
        reason: 'Empty file',
        status: 'skipped'
      };
      safeSendSSE(controller, {
        type: 'info',
        message: `⊘ Skipped ${file.path}: ${result.reason}`
      });
      return result;
    }

    // Enhanced enhancement decision making
    const shouldEnhance = shouldEnhanceFile(file.path, fileContent.content);
    if (!shouldEnhance.should) {
      const result: FileProcessingResult = { 
        path: file.path, 
        enhanced: false, 
        reason: shouldEnhance.reason,
        status: 'skipped'
      };
      safeSendSSE(controller, {
        type: 'info',
        message: `⊘ Skipped ${file.path}: ${result.reason}`
      });
      return result;
    }

    // Enhanced AI enhancement with better error handling
    let enhancedContent;
    try {
      enhancedContent = await sendToAI(
        `Improve this code for readability, efficiency, and stability:\n\n${fileContent.content}`,
        {
          addComments: true,
          optimizePerformance: true,
          improveErrorHandling: true,
          maintainCompatibility: true
        }
      );
    } catch (error) {
      const result: FileProcessingResult = { 
        path: file.path, 
        enhanced: false, 
        reason: error instanceof Error ? error.message : 'AI enhancement failed',
        status: 'error'
      };
      safeSendSSE(controller, {
        type: 'error',
        message: `✗ AI enhancement failed for ${file.path}: ${result.reason}`
      });
      return result;
    }

    // Enhanced content validation and comparison
    if (!enhancedContent || enhancedContent.length < 10) {
      const result: FileProcessingResult = { 
        path: file.path, 
        enhanced: false, 
        reason: 'AI response too short or empty',
        status: 'error'
      };
      safeSendSSE(controller, {
        type: 'error',
        message: `✗ Invalid AI response for ${file.path}: ${result.reason}`
      });
      return result;
    }

    // Enhanced content comparison
    if (enhancedContent.trim() === fileContent.content.trim()) {
      const result: FileProcessingResult = { 
        path: file.path, 
        enhanced: false, 
        reason: 'No improvements needed',
        status: 'unchanged'
      };
      safeSendSSE(controller, {
        type: 'info',
        message: `⊘ No changes needed for ${file.path}`
      });
      return result;
    }

    // Enhanced file update with better error handling
    try {
      await githubService.updateFile(
        file.path,
        enhancedContent,
        {
          sha: fileContent.sha,
          message: `🤖 AI enhancement: ${file.path}`
        }
      );

      const result: FileProcessingResult = { 
        path: file.path, 
        enhanced: true,
        status: 'enhanced',
        beforeSize: fileContent.content.length,
        afterSize: enhancedContent.length
      };

      safeSendSSE(controller, {
        type: 'success',
        message: `✓ Enhanced ${file.path}`
      });

      return result;
    } catch (error) {
      const result: FileProcessingResult = { 
        path: file.path, 
        enhanced: false, 
        reason: error instanceof Error ? error.message : 'Failed to update file',
        status: 'error'
      };
      safeSendSSE(controller, {
        type: 'error',
        message: `✗ Failed to update ${file.path}: ${result.reason}`
      });
      return result;
    }

  } catch (error) {
    const result: FileProcessingResult = { 
      path: file.path, 
      enhanced: false, 
      reason: error instanceof Error ? error.message : 'Unexpected error during file processing',
      status: 'error'
    };
    safeSendSSE(controller, {
      type: 'error',
      message: `✗ Unexpected error processing ${file.path}: ${result.reason}`
    });
    return result;
  }
}

/**
 * Enhanced enhancement cycle with better error handling and performance
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (!rateLimitResult.success) {
      return handleApiError(rateLimitResult.message || 'Rate limit exceeded', 'enhancement-cycle');
    }

    // Enhanced parameter validation
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const baseBranch = searchParams.get('baseBranch') || 'main';
    const cycleNumber = searchParams.get('cycleNumber');
    const autoMerge = searchParams.get('autoMerge') === 'true';

    const repoValidation = validateRepoParams(owner, repo);
    if (!repoValidation.valid) {
      return handleApiError(new Error(repoValidation.message || 'Invalid repository parameters'), 'enhancement-cycle');
    }

    if (!owner || !repo || !cycleNumber) {
      return handleApiError(new Error('Missing required parameters: owner, repo, cycleNumber'), 'enhancement-cycle');
    }

    // Create enhanced readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message immediately
        safeSendSSE(controller, {
          type: 'info',
          message: '🔗 SSE connection established - Starting enhancement cycle...'
        });

        // Set a timeout to prevent hanging connections
        const timeoutId = setTimeout(() => {
          if (!controller.signal.aborted) {
            safeSendSSE(controller, {
              type: 'error',
              message: 'Connection timeout - please try again'
            });
            controller.close();
          }
        }, 300000); // 5 minutes timeout

        const stats: EnhancementStats = {
          enhanced: 0,
          skipped: 0,
          unchanged: 0,
          errors: 0,
          total: 0
        };

        try {
          safeSendSSE(controller, {
            type: 'info',
            message: `🚀 Starting cycle ${cycleNumber} on base branch: ${baseBranch}`
          });

          let githubService;
          try {
            // Initialize GitHub service with repository parameters
            githubService = new GitHubService({
              owner,
              repo,
              branch: baseBranch
            });
          } catch (authError) {
            safeSendSSE(controller, {
              type: 'error',
              message: `❌ Authentication failed: ${authError instanceof Error ? authError.message : 'Invalid API credentials'}`
            });
            safeSendSSE(controller, {
              type: 'info',
              message: '💡 Please configure real API keys in the application settings or .env file'
            });
            controller.close();
            return;
          }

          // Enhanced repository validation
          const isValidRepo = await githubService.validateRepository();
          if (!isValidRepo) {
            safeSendSSE(controller, {
              type: 'error',
              message: `❌ Repository ${owner}/${repo} not found or not accessible`
            });
            controller.close();
            return;
          }

          // Enhanced branch management
          const newBranch = `ai-cycle-${cycleNumber}-${Date.now()}`;
          const branchResult = await githubService.ensureBranch(newBranch, { base: baseBranch });
          
          if (branchResult.created) {
            safeSendSSE(controller, {
              type: 'success',
              message: `✓ Created branch: ${newBranch}`
            });
          } else {
            safeSendSSE(controller, {
              type: 'info',
              message: `✓ Using existing branch: ${newBranch}`
            });
          }

          // Enhanced file listing with better error handling
          safeSendSSE(controller, {
            type: 'info',
            message: '📂 Scanning repository files...'
          });

          const files = await githubService.listFilesRecursive();
          stats.total = files.length;
          
          safeSendSSE(controller, {
            type: 'info',
            message: `Found ${files.length} files to process`
          });

          // Enhanced file processing with batching for better performance
          let consecutiveErrors = 0;
          
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Send progress update
            safeSendSSE(controller, {
              type: 'progress',
              progress: {
                current: i + 1,
                total: files.length,
                file: file.path
              }
            });

            const result = await enhanceAndPushFile(
              githubService,
              file,
              controller
            );

            // Enhanced statistics tracking
            if (result.status === 'enhanced') stats.enhanced++;
            else if (result.status === 'skipped') stats.skipped++;
            else if (result.status === 'unchanged') stats.unchanged++;
            else if (result.status === 'error') {
              stats.errors++;
              consecutiveErrors++;
              
              // Enhanced error recovery
              if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                safeSendSSE(controller, {
                  type: 'error',
                  message: `⚠️ Too many consecutive errors (${consecutiveErrors}). Stopping enhancement process.`
                });
                break;
              }
            } else {
              consecutiveErrors = 0; // Reset on success
            }

            // Send updated stats periodically
            if ((i + 1) % BATCH_SIZE === 0 || i === files.length - 1) {
              safeSendSSE(controller, {
                type: 'stats',
                stats
              });
            }
          }

          // Enhanced pull request creation with better error handling
          if (autoMerge && stats.enhanced > 0) {
            try {
              const summary = await generateEnhancementSummary(
                files.map(f => f.path).join(', '),
                `Enhanced ${stats.enhanced} files in cycle ${cycleNumber}`
              );

              const pr = await githubService.createPullRequest({
                title: `🤖 AI Cycle ${cycleNumber} Enhancements`,
                body: summary,
                head: newBranch,
                base: baseBranch
              });

              safeSendSSE(controller, {
                type: 'success',
                message: `✓ Created pull request #${pr.number}`
              });
            } catch (prError) {
              safeSendSSE(controller, {
                type: 'error',
                message: `✗ Failed to create PR: ${prError instanceof Error ? prError.message : 'Unknown error'}`
              });
            }
          }

          safeSendSSE(controller, {
            type: 'complete',
            newBranch,
            stats
          });

        } catch (error) {
          console.error('Error in enhancement cycle:', error);
          safeSendSSE(controller, {
            type: 'error',
            message: `Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        } finally {
          clearTimeout(timeoutId);
          controller.close();
        }
      }
    });

    // Enhanced response with better headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'Access-Control-Allow-Origin': '*', // CORS for development
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    return handleApiError(error, 'enhancement-cycle');
  }
}