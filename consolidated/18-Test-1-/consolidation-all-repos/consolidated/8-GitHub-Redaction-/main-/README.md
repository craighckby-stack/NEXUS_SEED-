// Import required modules
import axios from 'axios';
import dotenv from 'dotenv';
import { Buffer } from 'buffer';
import { TextEncoder } from 'util';

// Load environment variables from .env file
dotenv.config();

// Define constants
const GITHUB_API_ENDPOINT = 'https://api.github.com';
const GITHUB_API_HEADERS = {
  'Authorization': `token ${process.env.GITHUB_TOKEN}`,
  'Content-Type': 'application/json',
};
const SUPPORTED_EXTENSIONS = new Set(['.env', '.env.example', '.md']);
const DOT_FILES = new Set(['.gitignore', '.npmignore', '.yarnignore']);
const REDACT_TEXT_VALUE = 'Mike';

// Function to escape special characters in regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Define function to get file content
async function getFileContent(repoOwner, repoName, filePath) {
  try {
    const response = await axios.get(`${GITHUB_API_ENDPOINT}/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      headers: GITHUB_API_HEADERS,
    });
    return response.data.content;
  } catch (error) {
    console.error(`Error getting file content: ${error}`);
    return null;
  }
}

// Define function to update file content
async function updateFileContent(repoOwner, repoName, filePath, newContent) {
  try {
    const response = await axios.get(`${GITHUB_API_ENDPOINT}/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      headers: GITHUB_API_HEADERS,
    });
    const sha = response.data.sha;
    const encodedNewContent = Buffer.from(newContent).toString('base64');
    await axios.put(`${GITHUB_API_ENDPOINT}/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      message: 'Update file content',
      content: encodedNewContent,
      sha,
    }, {
      headers: GITHUB_API_HEADERS,
    });
  } catch (error) {
    console.error(`Error updating file content: ${error}`);
  }
}

// Function to check if file has supported extension
function isSupportedFile(filePath) {
  const fileExtension = filePath.substring(filePath.lastIndexOf('.'));
  return SUPPORTED_EXTENSIONS.has(fileExtension) || DOT_FILES.has(filePath);
}

// Function to redact text
function redactText(text, redactTextValue, caseSensitive = false, wordBoundary = false) {
  const flag = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(redactTextValue, flag);
  if (wordBoundary) {
    return text.replace(new RegExp(`\\b${escapeRegExp(redactTextValue)}\\b`, flag), '[REDACTED]');
  } else {
    return text.replace(regex, '[REDACTED]');
  }
}

// Define main function
async function run(repoOwner, repoName) {
  try {
    const response = await axios.get(`${GITHUB_API_ENDPOINT}/repos/${repoOwner}/${repoName}/git/trees/main`, {
      headers: GITHUB_API_HEADERS,
    });
    if (response.data.truncated) {
      throw new Error('Response truncated');
    }
    const files = response.data.tree;
    for (const file of files) {
      if (file.type === 'blob' && isSupportedFile(file.path)) {
        const fileContent = await getFileContent(repoOwner, repoName, file.path);
        if (fileContent) {
          const decodedFileContent = Buffer.from(fileContent, 'base64').toString('utf8');
          const newContent = redactText(decodedFileContent, REDACT_TEXT_VALUE, false, true);
          await updateFileContent(repoOwner, repoName, file.path, newContent);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

// Run main function
run('repo-owner', 'repo-name');