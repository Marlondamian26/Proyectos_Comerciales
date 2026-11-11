import { NextResponse } from "next/server";
import { resetCache } from "@/infrastructure";

export async function POST() {
  await resetCache();
  return NextResponse.json({ status: "cache cleared" });
}
