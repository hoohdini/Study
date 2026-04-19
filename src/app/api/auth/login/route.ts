import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSession, ensureAdminSeeded, sessionCookie, verifyPassword } from "@/lib/auth";
import { resolveCookieSecure } from "@/lib/https";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limit = checkRateLimit(`login:${ip}`, 8, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await ensureAdminSeeded();
    const admin = await verifyPassword(parsed.data.email, parsed.data.password);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await createSession(admin.email);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookie(token, resolveCookieSecure(request)));
    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Login failed:", error);
    }

    return NextResponse.json(
      { error: "Server error", code: "LOGIN_FAILED" },
      { status: 500 },
    );
  }
}
