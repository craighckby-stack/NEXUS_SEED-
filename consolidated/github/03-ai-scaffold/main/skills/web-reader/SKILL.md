/**
 * Web Reader Skill
 *
 * Implement web page content extraction capabilities using z-ai-web-dev-sdk.
 * Use this skill when the user needs to scrape web pages, extract article content,
 * retrieve page metadata, or build applications that process web content.
 * Supports automatic content extraction with title, HTML, and publication time retrieval.
 *
 * @license MIT
 */

import ZAI from 'z-ai-web-dev-sdk';

async function readWebPage(url) {
  try {
    const zai = await ZAI.create();

    const result = await zai.functions.invoke('page_reader', {
      url: url
    });

    console.log('Title:', result.data.title);
    console.log('URL:', result.data.url);
    console.log('Published:', result.data.publishedTime);
    console.log('HTML Content:', result.data.html);
    console.log('Tokens Used:', result.data.usage.tokens);

    return result.data;
  } catch (error) {
    console.error('Page reading failed:', error.message);
    throw error;
  }
}

async function extractArticleText(url) {
  const zai = await ZAI.create();

  const result = await zai.functions.invoke('page_reader', {
    url: url
  });

  const plainText = result.data.html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: result.data.title,
    text: plainText,
    url: result.data.url,
    publishedTime: result.data.publishedTime
  };
}

async function readMultiplePages(urls) {
  const zai = await ZAI.create();
  const results = [];

  for (const url of urls) {