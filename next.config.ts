import type { NextConfig } from "next";

// The Docker build sets this to the API service name; local `next dev` defaults to localhost.
// Browser requests remain same-origin and Next forwards `/api/*` server-side.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server in .next/standalone — the Dockerfile's runner stage copies it.
  output: "standalone",
  // The admin prompt playground waits for the AI: lyrics often 30-90 s, a full song several minutes
  // (music provider timeout defaults to 300 s). The dev proxy's default is 30 s.
  experimental: { proxyTimeout: 360_000 },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_PROXY_TARGET}/api/:path*` }];
  },
};

export default nextConfig;
