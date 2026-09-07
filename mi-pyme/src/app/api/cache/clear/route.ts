import { NextResponse } from "next/server";
import { clearCache } from "@/lib/cache";

export async function POST() {
  clearCache();
  return NextResponse.json({ status: "cache cleared" });
}
