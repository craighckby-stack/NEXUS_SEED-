// next.config.ts
import type { NextConfig } from 'next';

/**
 * Next.js configuration
 *
 * This file exports a single object that configures Next.js.
 *
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
const nextConfig: NextConfig = {
  // Enable strict mode for React
  reactStrictMode: true,

  // Output type for static HTML files
  target: 'serverless',

  // Standalone output for improved performance
  output: 'standalone',

  // List of packages to transpile for better support
  // @see https://nextjs.org/docs/api-reference/next-config#transpilepackages
  transpilePackages: ['z-ai-web-dev-sdk'],
};

export default nextConfig;