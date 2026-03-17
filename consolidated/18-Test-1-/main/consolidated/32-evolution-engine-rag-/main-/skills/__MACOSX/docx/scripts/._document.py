/**
 * Document processor module.
 * @module documentProcessor
 */

class DocumentProcessor {
  /**
   * Creates a new DocumentProcessor instance.
   * @param {string} filePath - The path to the document file.
   */
  constructor(filePath) {
    this.filePath = filePath;
  }

  /**
   * Reads the content of the document.
   * @returns {string|null} The content of the document, or null if the file is not found.
   */
  async readDocument() {
    try {
      const fileContent = await Deno.readTextFile(this.filePath);
      return fileContent;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.error(`File not found: ${this.filePath}`);
      } else {
        console.error(`An error occurred: ${error.message}`);
      }
      return null;
    }
  }

  /**
   * Writes new content to the document.
   * @param {string} content - The new content to write.
   * @returns {void}
   */
  async writeDocument(content) {
    try {
      await Deno.writeTextFile(this.filePath, content);
    } catch (error) {
      console.error(`An error occurred: ${error.message}`);
    }
  }
}

// Example usage:
if (import.meta.main) {
  const processor = new DocumentProcessor("example.docx");
  processor.readDocument().then((content) => {
    if (content) {
      console.log(content);
      processor.writeDocument("New content");
    }
  });
}