import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimized for deployment in containers/Docker environments.
  output: "standalone",

  // Crucially enables strict mode to enforce best React practices and catch deprecated usage or potential bugs.
  reactStrictMode: true,

  // Remove ignore flags to ensure TypeScript checks are enforced during build. 
  // Ignoring build errors is structurally unsound as it hides potential issues.
  typescript: {},

  // Ensure ESLint runs during builds to guarantee code quality. Ignoring linting is structurally unsound.
  eslint: {},
};

export default nextConfig;