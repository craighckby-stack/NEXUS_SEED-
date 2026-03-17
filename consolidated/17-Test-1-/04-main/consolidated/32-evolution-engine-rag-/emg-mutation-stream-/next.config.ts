import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for robust containerization/Docker environments
  output: "standalone",

  // Enable Strict Mode to detect potential problems early (Recommended)
  reactStrictMode: true,

  // Build Quality Suppression (Use with caution!)
  typescript: {
    // WARNING: Ignoring build errors is generally harmful for production quality.
    ignoreBuildErrors: true,
  },
  eslint: {
    // WARNING: Ignoring lint errors is generally harmful for production quality.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;