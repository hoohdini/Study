import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function safeQuery<T>(action: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Database query failed, using fallback.", error);
    }
    return fallback;
  }
}

export async function safeRawHealthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true as const };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Database health check failed.", error);
    }
    return { ok: false as const };
  }
}

type FindManyPost = Prisma.PostGetPayload<{
  include: { tags: { include: { tag: true } }; attachments: true };
}>;

export type PostWithRelations = FindManyPost;
