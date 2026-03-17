/**
 * APM_Canonizer: Generates deterministic, compact JSON byte streams.
 * Ensures lexicographical key ordering for cryptographic integrity (hashing/signing).
 */

// Helper to recursively sort object keys lexicographically.
function recursiveSort(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(recursiveSort);
  }

  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = recursiveSort(obj[key]);
  });
  return sorted;
}

const APM_Canonizer = (data) => {
  if (typeof data === 'undefined' || data === null) {
    throw new Error("Cannot canonize undefined or null data.");
  }
  
  // Ensure deterministic key order
  const sortedData = recursiveSort(data);
  
  // Stringify compactly (no spaces/indentation).
  const deterministicString = JSON.stringify(sortedData);
  
  // Return Buffer as required by the original specification for consistent byte representation.
  return Buffer.from(deterministicString, 'utf8');
};

export { APM_Canonizer };