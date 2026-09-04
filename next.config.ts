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
  experimental: {
    serverActions: {
      // Covers and note pictures are accepted up to COVER_MAX_BYTES (8 MB) and
      // ride to the server inside the Server Action's own request, which is
      // capped at 1 MB by default — so without this, every upload over 1 MB
      // was rejected by the framework before `imageProblem` ever saw it. The
      // extra megabyte is headroom for the boundaries and part headers
      // multipart adds on top of the file itself.
      bodySizeLimit: "9mb",
    },
  },
};

export default nextConfig;
