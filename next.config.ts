import type { NextConfig } from 'next';

/**
 * Root-level next.config.ts — kept for tooling compatibility.
 * The actual Next.js application lives in src/Frontend/ and is
 * run from there: `cd src/Frontend && npm run dev`
 */
const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
