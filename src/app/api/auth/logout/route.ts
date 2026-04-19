import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { resolveCookieSecure } from "@/lib/https";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearSessionCookie(resolveCookieSecure(request)));
  return response;
}
