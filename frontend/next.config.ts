import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Backend URL — overridden by NEXT_PUBLIC_API_URL env var if set in Vercel dashboard
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://bsdsteel-backend.onrender.com",
  },
};

export default nextConfig;
