import type { NextConfig } from "next";

import path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nextConfig: any = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config: any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      zod: path.resolve(process.cwd(), "node_modules/zod/index.cjs"),
    };
    return config;
  },
  async redirects() {
    return [
      { source: '/dashboard/team', destination: '/team', permanent: false },
      { source: '/dashboard/ai', destination: '/ai', permanent: false },
      { source: '/dashboard/ai-audit', destination: '/ai-audit', permanent: false },
      { source: '/dashboard/copilot', destination: '/copilot', permanent: false },
      { source: '/dashboard/inventory', destination: '/inventory', permanent: false },
      { source: '/dashboard/surplus', destination: '/surplus', permanent: false },
      { source: '/dashboard/matching', destination: '/matching', permanent: false },
      { source: '/dashboard/buy-for-me', destination: '/buy-for-me', permanent: false },
      { source: '/dashboard/sponsor', destination: '/sponsor', permanent: false },
      { source: '/dashboard/recovery', destination: '/recovery', permanent: false },
      { source: '/dashboard/routes', destination: '/routes', permanent: false },
      { source: '/dashboard/analytics', destination: '/analytics', permanent: false },
      { source: '/dashboard/digital-twin', destination: '/digital-twin', permanent: false },
      { source: '/dashboard/iot', destination: '/iot', permanent: false },
      { source: '/dashboard/requests', destination: '/requests', permanent: false },
      { source: '/dashboard/profile', destination: '/profile', permanent: false },
      { source: '/dashboard/settings', destination: '/settings', permanent: false },
    ];
  },
};

export default nextConfig;
