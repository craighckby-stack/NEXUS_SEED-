import type { NextConfig } from "next";

// --- Configuration Guards ---
// Use environment variables to explicitly control potentially dangerous configuration options.
const IGNORE_BUILD_ERRORS = process.env.NEXT_PUBLIC_IGNORE_BUILD_ERRORS === "true";
const STANDALONE_OUTPUT = process.env.STANDALONE_OUTPUT === "true";

// React Strict Mode defaults to true unless explicitly disabled in dev or production.
const DISABLE_STRICT_MODE = process.env.NEXT_PUBLIC_DISABLE_STRICT_MODE === "true";


/**
 * @type {import('next').NextConfig}
 */
const nextConfig: NextConfig = {
  // 1. Deployment Configuration
  output: STANDALONE_OUTPUT ? "standalone" : undefined,

  // 2. React Configuration
  // Strict mode helps find potential problems in applications.
  reactStrictMode: DISABLE_STRICT_MODE ? false : true,

  // 3. TypeScript Configuration
  typescript: {
    // WARNING: Ignoring build errors is HIGHLY discouraged. Enable only for temporary migration/testing.
    ignoreBuildErrors: IGNORE_BUILD_ERRORS,
  },

  // 4. ESLint Configuration
  eslint: {
    // WARNING: Ignoring linting during builds is HIGHLY discouraged as it risks deploying broken code style.
    ignoreDuringBuilds: IGNORE_BUILD_ERRORS,
  },

  // 5. Security Headers
  // Adding essential security headers for better application protection.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Clickjacking defense
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevent MIME type sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // 6. Image Optimization defaults
  images: {
    // Add default image settings here if needed (e.g., supported formats, device sizes)
  }
};

export default nextConfig;