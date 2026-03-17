// skills/asr/scripts/asr.ts

/**
 * ASR (Automatic Speech Recognition) script.
 */

// Import required modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Define constants
enum QuarantineAttributeKeys {
  QUARANTINE = 'com.apple.quarantine',
}

// Define a type for quarantine attributes
type QuarantineAttributes = Record<string, string>;

// Define a function to parse quarantine attributes
function parseQuarantineAttributes(attributes: string): QuarantineAttributes {
  const quarantineAttributes: QuarantineAttributes = {};
  const attributeParts = attributes.split(';');

  for (const part of attributeParts) {
    const [key, value] = part.split('=');
    if (key && value) quarantineAttributes[key] = value;
  }

  return quarantineAttributes;
}

// Define a function to extract quarantine information
function extractQuarantineInfo(quarantineAttributes: QuarantineAttributes): QuarantineAttributes {
  const quarantineInfo: QuarantineAttributes = {};

  if (quarantineAttributes[QuarantineAttributeKeys.QUARANTINE]) {
    const quarantineValue = quarantineAttributes[QuarantineAttributeKeys.QUARANTINE];
    const quarantineParts = quarantineValue.split(';');

    for (const part of quarantineParts) {
      const [key, value] = part.split('=');
      if (key && value) quarantineInfo[key] = value;
    }
  }

  return quarantineInfo;
}

// Example usage:
const attributes = 'q/0281;6947c099;Chrome;85FDA47E-8402-4854-B5EC-4BB9E7994EFC';
const quarantineAttributes = parseQuarantineAttributes(attributes);
const quarantineInfo = extractQuarantineInfo(quarantineAttributes);

console.log(quarantineInfo);