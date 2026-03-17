// skills/pptx/scripts/html2pptx.js
/**
 * Converts HTML presentation to PPTX format.
 * @module pptx
 */

import { spawn } from 'child_process';
import { resolve } from 'path';
import { tmpdir } from 'os';

// Configuration
const convertCommand = 'unoconv'; // Use 'unoconv' for OpenOffice conversion
const pptxExtension = '.pptx';
const tmpDirectory = tmpdir();

// Function to convert HTML to PPTX
async function convertHtmlToPptx(html) {
  // Create temporary file
  const tmpFile = resolve(tmpDirectory, 'temp.html');
  await fs.promises.writeFile(tmpFile, html);

  // Run conversion command
  const conversionProcess = spawn(convertCommand, [
    '-f',
    'pptx',
    tmpFile,
    `${tmpDirectory}/output${pptxExtension}`,
  ]);

  // Handle conversion output
  conversionProcess.stdout.on('data', (data) => {
    console.log(`Conversion output: ${data.toString()}`);
  });

  // Handle conversion errors
  conversionProcess.stderr.on('data', (data) => {
    console.error(`Conversion error: ${data.toString()}`);
  });

  // Wait for conversion to complete
  await new Promise((resolve) => {
    conversionProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error('Conversion failed');
        process.exit(1);
      }
    });
  });

  // Return converted PPTX file
  return `${tmpDirectory}/output${pptxExtension}`;
}

// Export conversion function
export default convertHtmlToPptx;
```

**