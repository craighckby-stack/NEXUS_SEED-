import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use 'standalone' output mode for optimized Docker/container deployment
  output: "standalone",

  // Disable React Strict Mode, often used when an external compiler/reloader (like nodemon) handles HMR,
  // preventing double rendering in development.
  reactStrictMode: false,

  // Configuration for build processes
  typescript: {
    // WARNING: Ignoring TypeScript build errors is generally discouraged.
    // This is maintained for rapid iteration speed, assuming strict checks happen in CI/external tools.
    ignoreBuildErrors: true,
  },

  eslint: {
    // Ignore ESLint errors during the build step for faster iteration.
    ignoreDuringBuilds: true,
  },

  // Add any common experimental features if needed, e.g., to optimize dependencies
  // experimental: {
  //   optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  // },
};

export default nextConfig;