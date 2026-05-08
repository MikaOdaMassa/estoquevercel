import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack – use Webpack to avoid the cross-directory
  // CSS module resolution issue with Tailwind v4
  serverExternalPackages: ['@prisma/client'],
  experimental: {},
};

export default nextConfig;
