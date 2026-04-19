import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { resolveCookieSecure } from "@/lib/https";

const encoder = new TextEncoder();

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === "/api/posts" && request.method === "GET") {
    return NextResponse.next();
  }

  const token = request.cookies.get("study_archive_session")?.value;
  const secret = process.env.AUTH_SECRET;

  if (!token || !secret) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    await jwtVerify(token, encoder.encode(secret));
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
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
