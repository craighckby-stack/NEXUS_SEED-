import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configures the build output for use in standalone environments (e.g., Docker).
  output: "standalone",

  // Enables React Strict Mode. This helps identify potential problems in applications
  // during development by running extra checks. This should be enabled for structurally superior code.
  reactStrictMode: true,

  // --- Quality Gates Enforcement ---
  
  // TypeScript: Errors MUST be fixed, not ignored. Removing ignoreBuildErrors.
  typescript: {
    // If errors exist, they must be addressed. Set to false by default.
    // If required for temporary migration, use a conditional environment variable.
    ignoreBuildErrors: false,
  },
  
  // ESLint: Errors MUST be fixed. Removing ignoreDuringBuilds.
  eslint: {
    // Linting errors must break the build to ensure code quality.
    ignoreDuringBuilds: false,
  },

  // Optional: Image configuration for better performance
  // images: {
  //   remotePatterns: [ /* define allowed external domains */ ],
  // },
};

export default nextConfig;