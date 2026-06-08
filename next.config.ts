import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Keep pdf-parse and mammoth out of the webpack bundle so their
  // native FS calls and test-file references don't break the build.
  serverExternalPackages: ['pdf-parse', 'mammoth'],
};

export default nextConfig;
