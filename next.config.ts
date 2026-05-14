import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  serverActions: {
    bodySizeLimit: "10mb",
  },
};

export default nextConfig;
