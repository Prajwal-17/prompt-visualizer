import type { NextConfig } from "next";

const pages = process.env.DEPLOY_TARGET === "pages";
const config: NextConfig = {
  ...(pages ? { output: "export" } : {}),
  trailingSlash: true,
  allowedDevOrigins: ["127.0.0.1"],
  images: { unoptimized: true },
  typescript: {
    tsconfigPath:
      process.env.NODE_ENV === "production"
        ? "tsconfig.build.json"
        : "tsconfig.json",
  },
  outputFileTracingExcludes: {
    "*": ["./.repos/**/*", "./docs/**/*", "./public/data/**/*"],
  },
  env: { NEXT_PUBLIC_DEPLOY_TARGET: pages ? "pages" : "workers" },
  experimental: { cpus: 2 },
};

export default config;
