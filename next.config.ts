import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["madkr.tplinkdns.com"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
