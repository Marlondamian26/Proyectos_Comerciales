import type { NextConfig } from "next";
import { validateAuthEnv } from "@/lib/auth/validate-env";

validateAuthEnv();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
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

export default nextConfig;
