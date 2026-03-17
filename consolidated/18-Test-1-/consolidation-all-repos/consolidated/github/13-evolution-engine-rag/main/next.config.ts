// next.config.ts
import type { NextConfig } from "next";

/**
 * Configuration for Next.js application.
 */
const config: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_TS_ERRORS === "true",
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_LINT_ERRORS === "true",
  },
};

export default config;