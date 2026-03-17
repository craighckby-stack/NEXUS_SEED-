// utilities.js (renamed to follow ES2024 standards and JavaScript syntax)

/**
 * Utility functions for skills module.
 */

/**
 * Calculates the Euclidean distance between two points.
 *
 * @param {number[]} point1 - The first point.
 * @param {number[]} point2 - The second point.
 * @returns {number} The distance between the two points.
 */
function calculateEuclideanDistance(point1, point2) {
  const [x1, y1] = point1;
  const [x2, y2] = point2;
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Prints a personalized greeting message.
 *
 * @param {string} name - The name to include in the greeting.
 */
function printGreeting(name) {
  globalThis.console.log(`Hello, ${name}!`);
}

/**
 * Main function for example usage.
 */
function main() {
  // Example usage:
  const point1 = [1, 2];
  const point2 = [4, 6];
  const distance = calculateEuclideanDistance(point1, point2);
  globalThis.console.log(`The distance between ${JSON.stringify(point1)} and ${JSON.stringify(point2)} is ${distance}`);

  printGreeting("World");
}

if (import.meta.main) {
  main();
}