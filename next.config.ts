import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/fiveo/demo",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.fiveomotorsport.com",
      },
    ],
  },
};

export default nextConfig;
