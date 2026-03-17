// Import required modules
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import logger from './logger';

// Define constants for video generation settings
const VIDEO_SETTINGS = {
  quality: 'speed',
  withAudio: false,
  size: '1920x1080',
  fps: 30,
  duration: 5,
};

// Define MIME type map for image file extensions
const MIMETYPE_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
};

// Define video generation function
async function createVideoPrompt(
  prompt: string,
  imagePath?: string,
): Promise<{ zai: any; task: any }> {
  try {
    // Create ZAI instance
    const zai = await ZAI.create();

    console.log('Creating video generation task...');

    // Create video generation task with text prompt
    const task = await zai.video.generations.create({
      prompt,
      ...VIDEO_SETTINGS,
    });

    console.log('Task created!');
    console.log(`Task ID: ${task.id}`);
    console.log(`Task Status: ${task.task_status}`);
    console.log(`Model: ${task.model || 'N/A'}`);

    return { zai, task };
  } catch (err) {
    logger.error(`Video generation failed: ${err.message}`);
    throw err;
  }
}

// Define image-to-video generation function
async function createVideoFromImage(imagePath: string): Promise<{ zai: any; task: any }> {
  try {
    // Create ZAI instance
    const zai = await ZAI.create();

    console.log('Creating image-to-video generation task...');
    console.log(`Reading image from: ${imagePath}`);

    // Read image file and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);

    // Detect MIME type from file extension
    const imageExt = imagePath.split('.').pop()?.toLowerCase() || '';
    const mimeType = MIMETYPE_MAP[imageExt] || 'image/jpeg'; // Default to JPEG if unknown

    const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

    console.log(`Image format detected: ${mimeType}`);
    console.log(`Image converted to base64 (${base64Image.substring(0, 50)}...)`);

    // Create video generation task with base64 image
    const task = await zai.video.generations.create({
      image_url: base64Image,
      prompt: 'Animate this scene with gentle motion',
      ...VIDEO_SETTINGS,
    });

    console.log('Task created!');
    console.log(`Task ID: ${task.id}`);
    console.log(`Task Status: ${task.task_status}`);
    console.log(`Model: ${task.model || 'N/A'}`);

    return { zai, task };
  } catch (err) {
    logger.error(`Image-to-video generation failed: ${err.message}`);
    throw err;
  }
}

// Define function to query task status
async function queryTaskStatus(zai: any, taskId: string): Promise<any> {
  try {
    // Query task status
    let result = await zai.async.result.query(taskId);

    if (result.task_status === 'SUCCESS') {
      // Return task result if task completes immediately
      console.log('\nTask completed immediately, fetching result...');
      displayResult(result);
      return result;
    }

    // Poll task status
    console.log('\nPolling for result...');
    let pollCount = 0;
    const maxPolls = 30; // Maximum polls
    const pollInterval = 10000; // Polling interval in milliseconds

    while (result.task_status === 'PROCESSING' && pollCount < maxPolls) {
      pollCount++;
      console.log(`Poll ${pollCount}/${maxPolls}: Status is ${result.task_status}, waiting ${pollInterval / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      result = await zai.async.result.query(taskId);
    }

    displayResult(result);
    return result;
  } catch (err) {
    logger.error(`Query failed: ${err.message}`);
    throw err;
  }
}

// Define main function
async function main() {
  try {
    // Create video generation task
    const { zai, task } = await createVideoPrompt('A cat is playing with a ball.');

    // Create image-to-video generation task
    // NOTE: Uncomment the following line and comment out the above line to use image-to-video
    // const { zai, task } = await createVideoFromImage('./path/to/your/image.jpg');

    // Query task status
    await queryTaskStatus(zai, task.id);
  } catch (err) {
    logger.error(`Video generation failed: ${err.message}`);
    process.exit(1);
  }
}

// Define function to display task result
function displayResult(result: any) {
  console.log('\n=== Result ===');
  console.log(`Task Status: ${result.task_status}`);
  console.log(`Model: ${result.model || 'N/A'}`);
  console.log(`Request ID: ${result.request_id || 'N/A'}`);

  if (result.task_status === 'SUCCESS') {
    // Attempt to retrieve video URL from task result
    const videoUrl =
      result.video_result?.[0]?.url ||
      result.video_url ||
      result.url ||
      result.video;

    if (videoUrl) {
      console.log('\n✅ Video generated successfully!');
      console.log(`Video URL: ${videoUrl}`);
      console.log('\nYou can open this URL in your browser or download it.');
    } else {
      console.log('\n⚠️ Task completed but video URL not found in response.');
      console.log(`Full response:`, JSON.stringify(result, null, 2));
    }
  } else if (result.task_status === 'PROCESSING') {
    console.log('\n⏳ Task is still processing. Please try again later.');
    console.log(`Task ID: ${result.id || 'N/A'}`);
  } else if (result.task_status === 'FAIL') {
    console.log('\n❌ Task failed.');
    console.log(`Full response:`, JSON.stringify(result, null, 2));
  }
}

// Run main function
main();