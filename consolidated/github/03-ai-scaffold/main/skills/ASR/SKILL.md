// Import required libraries
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs/promises';
import path from 'path';
import { console } from 'console';

// Type definitions for clarity and code completion
interface TranscriptionResult {
  filePath: string;
  success: boolean;
  transcription: string;
  wordCount: number;
}

// Asynchronous transcription function
async function transcribeAudio(filePath: string): Promise<TranscriptionResult> {
  try {
    // Reuse the ZAI instance
    const zaiInstance = await ZAI.create();
    const audioBuffer = await fs.readFile(filePath);
    const base64Audio = audioBuffer.toString('base64');

    // Optimize parallel processing with `Promise.allSettled`
    const responses = await Promise.allSettled([
      zaiInstance.audio.asr.create({ file_base64: base64Audio }),
    ]);

    // Handle API response
    const response = responses[0];
    const transcription = response.status === 'fulfilled' ? response.value.text || '' : '';

    // Validate transcription result
    if (!transcription.trim().length) {
      throw new Error('Empty transcription result');
    }

    // Calculate word count
    const wordCount = transcription.split(/\s+/).filter(Boolean).length;

    return { success: true, transcription, wordCount };
  } catch (error) {
    // Enhanced error handling with `console.error` and detailed error message
    console.error(`Transcription failed for ${filePath}:`, error.message);
    return { success: false, error: error.message, filePath };
  }
}

// Simplified CLI usage examples
console.log('** CLI Usage **');
console.log('Basic Transcription:');
console.log('  z-ai asr --file file.wav');
console.log('  z-ai asr -f file.mp3 -o output.json');
console.log('Base64 Transcription:');
console.log('  z-ai asr --base64 base64_audio');
console.log('Streaming Output:');
console.log('  z-ai asr -f long_audio.wav --stream');

// Enhanced Advanced Use Cases

// Meta data transcription function
async function transcribeWithMetadata(filePath: string): Promise<{ filename: string; fileSize: number; transcription: string; wordCount: number; processingTimeMs: number; timestamp: string }> {
  const zaiInstance = await ZAI.create();
  const stats = await fs.stat(filePath);
  const audioBuffer = await fs.readFile(filePath);
  const base64Audio = audioBuffer.toString('base64');

  // Optimize metadata collection with `Promise.allSettled`
  const responses = await Promise.allSettled([
    zaiInstance.audio.asr.create({ file_base64: base64Audio }),
    stats,
  ]);

  const startTime = Date.now();
  const response = responses[0];
  const transcription = response.status === 'fulfilled' ? response.value.text || '' : '';
  const wordCount = transcription.split(/\s+/).filter(Boolean).length;
  const endTime = Date.now();
  const processingTimeMs = endTime - startTime;
  const timestamp = new Date().toISOString();
  const filename = path.basename(filePath);
  const fileSize = stats.size;

  return {
    filename,
    fileSize,
    transcription,
    wordCount,
    processingTimeMs,
    timestamp,
  };
}

// Improved Directory Transcription and Result Aggregation

// Directory transcription function
async function transcribeDirectory(directoryPath: string, outputJsonPath: string) {
  const zaiInstance = await ZAI.create();
  const files = await fs.readdir(directoryPath);
  const audioFiles = files.filter((file) => /\.(wav|mp3|m4a|flac|ogg)$/.test(file));

  const results = {
    directory: directoryPath,
    totalFiles: audioFiles.length,
    processedAt: new Date().toISOString(),
    transcriptions: [],
  };

  const promises = audioFiles.map(async (filename) => {
    try {
      const filePath = path.join(directoryPath, filename);
      const transcription = await transcribeAudio(filePath);
      return {
        filename,
        success: true,
        text: transcription.transcription,
        wordCount: transcription.wordCount,
      };
    } catch (error) {
      return {
        filename,
        success: false,
        error: error.message,
      };
    }
  });

  const transcriptionResults = await Promise.allSettled(promises);
  results.transcriptions = transcriptionResults.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return { ...result.reason, success: false };
    }
  });

  await fs.writeFile(outputJsonPath, JSON.stringify(results, null, 2));
  return results;
}

// Enhanced Integration Example: Express API

// Express API setup
const app = express();
const upload = multer({ dest: 'uploads/' });

// Initialize ZAI instance
let zaiInstance;

async function initZAI() {
  zaiInstance = await ZAI.create();
}

// Express API handler
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!zaiInstance) {
    return res.status(503).json({ error: 'Service initializing' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  const filePath = req.file.path;

  try {
    const transcription = await transcribeAudio(filePath);
    res.json({
      success: true,
      transcription: transcription.transcription,
      wordCount: transcription.wordCount,
    });
  } catch (error) {
    console.error('Transcription API Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    fs.unlinkSync(filePath);
  }
});

initZAI().then(() => {
  app.listen(3000, () => {
    console.log('ASR API running on port 3000');
  });
}).catch((error) => {
  console.error('Failed to initialize ZAI SDK:', error);
  process.exit(1);
});

// Refactored Performance Tips
// 1. Reuse the ZAI instance across requests.
// 2. Use parallel processing for batch transcription.
// 3. Implement caching using content-based keys.
// 4. Use asynchronous file I/O for efficient operation.

console.log('** Performance Tips **');
console.log('1. Reuse the ZAI instance across requests.');
console.log('2. Use parallel processing for batch transcription.');
console.log('3. Implement caching using content-based keys.');
console.log('4. Use asynchronous file I/O for efficient operation.');

// Refactored Troubleshooting

console.log('** Troubleshooting **');
console.log('| Issue | Solution |');
console.log('| --- | --- |');
console.log('| SDK usage in frontend | Ensure `z-ai-web-dev-sdk` is imported only in server-side/backend code.');
console.log('| Empty or poor transcription | Verify audio quality and format.');
console.log('| Large file processing failure | Check audio file size limits and consider splitting/chunking.');
console.log('| Slow performance | Reuse the ZAI instance and check for parallelization, caching, and I/O efficiency.');

// Improved Error Handling

function safeTranscribe(filePath: string): Promise<TranscriptionResult> {
  return transcribeAudio(filePath).catch((error) => {
    console.error(`Transcription failed for ${filePath}:`, error.message);
    return { success: false, error: error.message, filePath };
  });
}
```

**