import ZAI from "z-ai-web-dev-sdk";
import { createReadStream, writeFileSync } from "fs";
import { resolve } from "path";

const DEFAULT_VOICE = "tongtong";
const DEFAULT_OUTFILE = "output.wav";
const MAX_TEXT_PREVIEW = 50;

async function ttsMain(text?: string, outputFile?: string) {
  if (!text) {
    console.error("ERROR: Text input required. Usage: node tts.js \"Your text here\" [optional/output/path.wav]");
    process.exit(1);
  }

  const outputFile = outputFile || DEFAULT_OUTFILE;
  const absoluteOutputFile = resolve(outputFile);

  const previewText = text.length > MAX_TEXT_PREVIEW
    ? `${text.substring(0, MAX_TEXT_PREVIEW)}...`
    : text;

  try {
    console.log("Initializing ZAI SDK...");

    const zai = await ZAI.create();
    console.log(`Synthesizing text: "${previewText}"`);

    const ttsResponse = await zai.audio.tts.create({
      input: text,
      voice: DEFAULT_VOICE,
      speed: 1.0,
      response_format: "wav",
    });

    if (!ttsResponse || !ttsResponse.arrayBuffer) {
      throw new Error("Invalid or unexpected response structure received from TTS API.");
    }

    const ttsArrayBuffer = await ttsResponse.arrayBuffer();
    const buffer = Buffer.from(ttsArrayBuffer);

    await writeFileSync(absoluteOutputFile, buffer);
    console.log(`\n[SUCCESS] Audio saved: ${absoluteOutputFile}`);
  } catch (error) {
    console.error("\nFATAL TTS FAILURE:");
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(`Unknown error: ${String(error)}`);
    }
    process.exit(1);
  }
}

if (process.argv.length === 3) {
  const [rawText, rawOutputFile] = process.argv.slice(2);
  const text = rawText?.trim() ?? '';
  ttsMain(text, rawOutputFile);
} else if (process.argv.length === 2) {
  ttsMain();
} else {
  console.error("Invalid number of arguments. Usage: node tts.js [text] [optional/output/path.wav]");
  process.exit(1);
}