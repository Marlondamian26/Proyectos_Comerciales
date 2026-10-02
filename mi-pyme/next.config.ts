import type { NextConfig } from "next";
import { validateAuthEnv } from "@/lib/auth/validate-env";
import withBundleAnalyzer from "@next/bundle-analyzer";

validateAuthEnv();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
      { protocol: "https", hostname: "**.github.com" },
      { protocol: "https", hostname: "**.vercel.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.imgur.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/auth/resetear/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

const analyzedConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);

export default analyzedConfig;
