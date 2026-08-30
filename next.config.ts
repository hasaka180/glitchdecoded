import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack ignores lockfiles further up in $HOME.
  turbopack: { root: path.resolve(".") },
};

export default nextConfig;
