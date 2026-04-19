import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { resolveCookieSecure, toPublicUrl } from "@/lib/https";

const encoder = new TextEncoder();

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/");
}

function jsonAuthError(
  request: NextRequest,
  status: number,
  body: Record<string, string>,
  clearSession: boolean,
) {
  const res = NextResponse.json(body, { status });
  if (clearSession) {
    res.cookies.set({
      name: "study_archive_session",
      value: "",
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: resolveCookieSecure(request),
      sameSite: "lax",
    });
  }
  return res;
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === "/api/posts" && request.method === "GET") {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("study_archive_session")?.value;
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    console.warn("[proxy] Missing AUTH_SECRET; redirecting to login", {
      path: pathname,
    });
    if (isApiPath(pathname)) {
      return jsonAuthError(request, 500, { error: "Server misconfigured", code: "AUTH_SECRET_MISSING" }, false);
    }
    return NextResponse.redirect(toPublicUrl(request, "/admin/login"));
  }

  if (!token) {
    console.warn("[proxy] Missing session cookie; redirecting to login", {
      path: pathname,
    });
    if (isApiPath(pathname)) {
      return jsonAuthError(request, 401, { error: "Unauthorized", code: "NO_SESSION" }, false);
    }
    return NextResponse.redirect(toPublicUrl(request, "/admin/login"));
  }

  try {
    await jwtVerify(token, encoder.encode(secret));
    return NextResponse.next();
  } catch (error) {
    console.warn("[proxy] Invalid session token; redirecting to login", {
      path: pathname,
      message: error instanceof Error ? error.message : "unknown",
    });
    if (isApiPath(pathname)) {
      return jsonAuthError(request, 401, { error: "Unauthorized", code: "INVALID_SESSION" }, true);
    }
    const response = NextResponse.redirect(toPublicUrl(request, "/admin/login"));
    response.cookies.set({
      name: "study_archive_session",
      value: "",
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: resolveCookieSecure(request),
      sameSite: "lax",
    });
    return response;
  }
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/posts", "/api/upload"],
};
