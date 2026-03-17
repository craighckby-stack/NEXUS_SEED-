import ZAI from 'z-ai-web-dev-sdk';
import { promises as fs } from 'fs';

async function generateImage(prompt: string, size: keyof typeof sizes, outFile: string) {
	try {
		const { zai } = await ZAI.create();

		const { data } = await zai.images.generations.create({
			prompt,
			size
		});

		if (!data || !data[0] || !data[0].base64) {
			console.error('No image data returned by the API');
			console.log('Full response:', JSON.stringify(data, null, 2));
			return;
		}

		const buffer = Buffer.from(data[0].base64, 'base64');
		await fs.writeFile(outFile, buffer);
		console.log(`Image saved to ${outFile}`);
	} catch (err: any) {
		console.error('Image generation failed:', err?.message || err);
	}
}

const sizes = {
	'1024x1024': '1024x1024',
	'768x1344': '768x1344',
	'864x1152': '864x1152',
	'1344x768': '1344x768',
	'1152x864': '1152x864',
	'1440x720': '1440x720',
	'720x1440': '720x1440'
};

const imageSize = '1024x1024'; // Example size
const outputFilename = 'output.png'; // Example output filename

generateImage('A cute kitten', imageSize, outputFilename);