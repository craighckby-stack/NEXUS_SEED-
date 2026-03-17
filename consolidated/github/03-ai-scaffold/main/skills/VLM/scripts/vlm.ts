import { createVision, VisionMessage } from 'z-ai-web-dev-sdk';

async function main() {
  const [imageUrl, ...prompt] = process.argv.slice(2);
  const promptText = prompt.join(' ').trim();

  if (!imageUrl || !promptText) {
    console.error('ERROR: Both image URL and prompt are required.\nUsage: node vlm.js <image_url> <prompt>');
    process.exit(1);
  }

  try {
    const { zai } = await create('glm-4.6v');

    const combinedPrompt = `Output only text, no markdown. Be concise. Analyze the provided content. QUERY: ${promptText}`;

    const messages: VisionMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: combinedPrompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ];

    const response = await zai.chat.completions.createVision({
      model: 'glm-4.6v',
      messages,
      thinking: { type: 'disabled' },
    });

    const reply = response.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      console.error('FATAL: No reply content received.');
      process.exit(1);
    }

    console.log(reply);

  } catch (err: any) {
    console.error('FATAL Vision Chat Failure:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
```

**