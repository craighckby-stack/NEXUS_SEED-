import { createClient } from 'z-ai-web-dev-sdk';

async function main() {
  const [prompt] = process.argv.slice(2);
  if (!prompt) {
    console.error('Error: Prompt required. Usage: node chat.js "Query"');
    process.exit(1);
  }

  try {
    console.log(`> ${prompt}`);

    const client = await createClient();
    const response = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'glm-4-flash',
      stream: false,
      thinking: { type: 'disabled' },
    });

    const { message: { content: reply } } = response.choices?.[0] ?? {};
    console.log('\n--- REPLY ---\n');
    reply?.trim() && console.log(reply);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\nFATAL ERROR: ${errorMessage}`);
  }
}

main();