import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enables standalone output when building in Docker / CI
  output: process.env.STANDALONE === "true" ? "standalone" : undefined,
  outputFileTracingRoot: path.resolve(__dirname),
  serverExternalPackages: ["@prisma/client"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
