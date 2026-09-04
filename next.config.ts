import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack ignores lockfiles further up in $HOME.
  turbopack: { root: path.resolve(".") },
  // Testing on a real handset means loading the dev server over the LAN, and
  // dev blocks cross-origin requests to its own assets by default — the chunks
  // come back 403, nothing hydrates, and the page reads as broken rather than
  // as blocked. Development only; production serves static chunks and is not
  // affected either way.
  allowedDevOrigins: ["192.168.1.*", "*.local"],
};

export default nextConfig;
