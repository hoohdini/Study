import { NextResponse } from "next/server";
import { safeRawHealthCheck } from "@/lib/safe-db";

export async function GET() {
  const result = await safeRawHealthCheck();
  if (!result.ok) {
    return NextResponse.json({ status: "degraded", uptime: process.uptime() }, { status: 503 });
  }
  return NextResponse.json({ status: "ok", uptime: process.uptime() });
}
