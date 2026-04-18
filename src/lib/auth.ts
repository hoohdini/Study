import argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const TOKEN_NAME = "study_archive_session";
const encoder = new TextEncoder();

export async function ensureAdminSeeded() {
  const env = getEnv();
  const existing = await prisma.adminUser.findUnique({ where: { email: env.ADMIN_EMAIL } });
  if (existing) return;

  const passwordHash = await argon2.hash(env.ADMIN_PASSWORD);
  await prisma.adminUser.create({
    data: {
      email: env.ADMIN_EMAIL,
      passwordHash,
    },
  });
}

export async function verifyPassword(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) return null;

  const valid = await argon2.verify(admin.passwordHash, password);
  if (!valid) return null;

  return admin;
}

export async function createSession(email: string) {
  const env = getEnv();
  return new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(encoder.encode(env.AUTH_SECRET));
}

export async function verifySession(token: string) {
  const env = getEnv();
  try {
    const verified = await jwtVerify(token, encoder.encode(env.AUTH_SECRET));
    return verified.payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;

  return verifySession(token);
}

export function sessionCookie(token: string) {
  return {
    name: TOKEN_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24,
  };
}

export function clearSessionCookie() {
  return {
    name: TOKEN_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
