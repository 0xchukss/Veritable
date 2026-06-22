import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@0gfoundation/0g-storage-ts-sdk"],
  reactStrictMode: false,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
