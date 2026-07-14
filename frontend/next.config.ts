import type { NextConfig } from "next";
import { SECURITY_CONFIG } from "./security-rules";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [...SECURITY_CONFIG.HEADERS],
      },
    ];
  },
  async rewrites() {
    // BACKEND_API_URL is a server-only env var (not prefixed NEXT_PUBLIC_).
    // It is used here to proxy /api/* requests from the browser to the real backend.
    //
    // IMPORTANT: In production, set NEXT_PUBLIC_API_URL=/api (or leave it unset)
    // so the browser sends all API calls to the same-origin /api/* path.
    // Next.js will then forward them to BACKEND_API_URL on the server side.
    //
    // This makes all cookies first-party (frontend domain), which is required
    // for cookies to work in incognito mode and browsers that block cross-origin cookies.
    //
    // DO NOT point NEXT_PUBLIC_API_URL directly at the backend in production.
    const backendUrl =
      process.env.BACKEND_API_URL || "http://localhost:5001";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
