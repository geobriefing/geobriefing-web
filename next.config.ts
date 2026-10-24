import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      // Jobs were replaced by Data drops.
      { source: "/jobs", destination: "/", statusCode: 301 },
      { source: "/jobs/:path*", destination: "/", statusCode: 301 },
    ];
  },
};

export default nextConfig;
