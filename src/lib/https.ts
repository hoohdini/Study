import type { NextRequest } from "next/server";

function isHttpsFromBaseUrl() {
  const baseUrl = process.env.BASE_URL;
  return Boolean(baseUrl?.toLowerCase().startsWith("https://"));
}

function isHttpsFromRequest(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded?.toLowerCase() === "https") return true;

  return request.nextUrl.protocol === "https:";
}

function isPrivateOrDockerInternalHost(hostname: string) {
  if (hostname === "localhost" || hostname.endsWith(".local")) return false;

  if (hostname.startsWith("172.")) return true;
  if (hostname.startsWith("10.")) return true;

  if (hostname.startsWith("192.168.")) return true;

  if (hostname.startsWith("127.")) return true;

  return false;
}

export function getPublicOrigin(request: NextRequest) {
  const baseUrl = process.env.BASE_URL;
  if (baseUrl) {
    return new URL(baseUrl).origin;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const forwardedHostHeader = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedHost =
    forwardedHostHeader && !isPrivateOrDockerInternalHost(forwardedHostHeader.split(":")[0] ?? forwardedHostHeader)
      ? forwardedHostHeader
      : request.headers.get("host") ?? request.nextUrl.host;

  const forwardedPort = request.headers.get("x-forwarded-port");
  const explicitPort = forwardedPort ?? "";

  const hostHasPort = forwardedHost.includes(":");
  const defaultPort = forwardedProto === "https" ? "443" : "80";
  const port = hostHasPort ? "" : explicitPort && explicitPort !== defaultPort ? `:${explicitPort}` : "";

  return `${forwardedProto}://${forwardedHost}${port}`;
}

export function toPublicUrl(request: NextRequest, pathname: string) {
  return new URL(pathname, getPublicOrigin(request)).toString();
}

export function resolveCookieSecure(request: NextRequest) {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;

  if (isHttpsFromRequest(request)) return true;
  if (process.env.NODE_ENV === "production" && isHttpsFromBaseUrl()) return true;

  return false;
}
