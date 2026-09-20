import type { NextConfig } from "next";
import nextPackage from "next/package.json";
import path from "path";

const nextMajor = parseInt(nextPackage.version.split(".")[0] || "0", 10);
const isNext16OrLater = nextMajor >= 16;

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  ...(isNext16OrLater
    ? { reactCompiler: true }
    : {
        experimental: {
          reactCompiler: true,
        },
      }),
};

export default nextConfig;
