import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";

const handler = NextAuth(authOptions);

export async function GET(req: NextRequest) {
  return handler.GET(req);
}

export async function POST(req: NextRequest) {
  return handler.POST(req);
}
