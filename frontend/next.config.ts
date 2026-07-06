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
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:5001";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
