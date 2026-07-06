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
};

export default nextConfig;
