import type { NextRequest } from "next/server";

function isHttpsFromBaseUrl() {
  const baseUrl = process.env.BASE_URL;
  return Boolean(baseUrl?.toLowerCase().startsWith("https://"));
}

function isHttpsFromRequest(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-proto");
  return forwarded?.toLowerCase() === "https";
}

export function resolveCookieSecure(request: NextRequest) {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;

  if (isHttpsFromRequest(request)) return true;
  if (process.env.NODE_ENV === "production" && isHttpsFromBaseUrl()) return true;

  return false;
}
