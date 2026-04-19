import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSession, ensureAdminSeeded, sessionCookie, verifyPassword } from "@/lib/auth";
import { resolveCookieSecure } from "@/lib/https";
import { getEnv } from "@/lib/env";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function wantsHtml(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limit = checkRateLimit(`login:${ip}`, 8, 10 * 60 * 1000);
  if (!limit.allowed) {
    if (wantsHtml(request)) {
      return NextResponse.redirect(new URL("/admin/login?error=rate", request.url), { status: 303 });
    }
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    getEnv();
  } catch (error) {
    if (error instanceof ZodError) {
      if (wantsHtml(request)) {
        return NextResponse.redirect(new URL("/admin/login?error=env", request.url), { status: 303 });
      }
      return NextResponse.json(
        {
          error: "Server misconfigured",
          code: "ENV_INVALID",
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 500 },
      );
    }

    if (wantsHtml(request)) {
      return NextResponse.redirect(new URL("/admin/login?error=env", request.url), { status: 303 });
    }
    return NextResponse.json({ error: "Server misconfigured", code: "ENV_INVALID" }, { status: 500 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let email = "";
    let password = "";

    if (contentType.includes("application/json")) {
      const json = await request.json();
      const parsed = bodySchema.safeParse(json);
      if (!parsed.success) {
        if (wantsHtml(request)) {
          return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), { status: 303 });
        }
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }
      email = parsed.data.email;
      password = parsed.data.password;
    } else {
      const form = await request.formData();
      email = String(form.get("email") ?? "");
      password = String(form.get("password") ?? "");
      const parsed = bodySchema.safeParse({ email, password });
      if (!parsed.success) {
        if (wantsHtml(request)) {
          return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), { status: 303 });
        }
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }
    }

    await ensureAdminSeeded();
    const admin = await verifyPassword(email, password);
    if (!admin) {
      if (wantsHtml(request)) {
        return NextResponse.redirect(new URL("/admin/login?error=auth", request.url), { status: 303 });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await createSession(admin.email);
    if (wantsHtml(request)) {
      const response = NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
      response.cookies.set(sessionCookie(token, resolveCookieSecure(request)));
      return response;
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookie(token, resolveCookieSecure(request)));
    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Login failed:", error);
    }

    if (wantsHtml(request)) {
      return NextResponse.redirect(new URL("/admin/login?error=server", request.url), { status: 303 });
    }
    return NextResponse.json(
      { error: "Server error", code: "LOGIN_FAILED" },
      { status: 500 },
    );
  }
}
