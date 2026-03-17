// Import required modules
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs/promises';
import path from 'path';

// Define constants
const SUPPORT_EMAIL = 'support@example.com';
const MAX_FILE_SIZE_MB = 100;
const SUPPORTED_AUDIO_FORMATS = ['.wav', '.mp3', '.m4a', '.flac', '.ogg'];

// Define a function to validate audio file format
const isValidAudioFormat = (filePath) => {
  const fileExtension = path.extname(filePath).toLowerCase();
  return SUPPORTED_AUDIO_FORMATS.includes(fileExtension);
};

// Define a function to get file size in MB
const getFileSizeInMB = async (filePath) => {
  const fileStats = await fs.stat(filePath);
  return fileStats.size / (1024 * 1024);
};

// Define a function to transcribe audio
const transcribeAudioFile = async (audioFilePath) => {
  try {
    // Check if file exists
    await fs.access(audioFilePath);

    // Validate audio file format
    if (!isValidAudioFormat(audioFilePath)) {
      throw new Error(`Unsupported audio format: ${path.extname(audioFilePath)}`);
    }

    // Check file size
    const fileSizeInMB = await getFileSizeInMB(audioFilePath);
    if (fileSizeInMB > MAX_FILE_SIZE_MB) {
      throw new Error(`File too large: ${fileSizeInMB.toFixed(2)}MB (max ${MAX_FILE_SIZE_MB}MB)`);
    }

    // Create ZAI instance
    const zaiInstance = await ZAI.create();

    // Read audio file and convert to base64
    const audioFileBuffer = await fs.readFile(audioFilePath);
    const base64Audio = audioFileBuffer.toString('base64');

    // Transcribe audio
    const transcriptionResponse = await zaiInstance.audio.asr.create({
      file_base64: base64Audio
    });

    return transcriptionResponse.text;
  } catch (error) {
    throw error;
  }
};

// Define a function to handle errors
const logAndReportError = (error) => {
  console.error('Error:', error);
  // Send error report to support email
  // ...
};

// Define a function to clean transcription text
const cleanTranscription = (text) => {
  // Remove excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Capitalize first letter of sentences
  text = text.replace(/(^\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());

  // Remove filler words (optional)
  const fillerWords = ['um', 'uh', 'ah', 'like', 'you know'];
  const fillerPattern = new RegExp(`\\b(${fillerWords.join('|')})\\b`, 'gi');
  text = text.replace(fillerPattern, '').replace(/\s+/g, ' ');

  return text;
};

// Example usage
const main = async () => {
  try {
    const audioFilePath = './example.wav';
    const transcriptionText = await transcribeAudioFile(audioFilePath);
    const cleanedTranscriptionText = cleanTranscription(transcriptionText);
    console.log('Transcription:', cleanedTranscriptionText);
  } catch (error) {
    logAndReportError(error);
  }
};

main();