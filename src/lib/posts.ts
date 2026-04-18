import slugify from "slugify";
import { Category, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function toKoreanCategory(category: Category) {
  return category === "SOCIETY" ? "학회" : "전공";
}

export function normalizeSlug(input: string) {
  const normalized = slugify(input, { lower: true, strict: true, trim: true });
  return normalized || `post-${Date.now().toString(36)}`;
}

export async function buildUniqueSlug(base: string) {
  const normalized = normalizeSlug(base);
  let slug = normalized;
  let i = 1;

  while (await prisma.post.findUnique({ where: { slug } })) {
    i += 1;
    slug = `${normalized}-${i}`;
  }

  return slug;
}

export async function upsertTags(tx: Prisma.TransactionClient, tags: string[]) {
  const uniqueTags = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  const tagRecords = [] as { id: string }[];

  for (const name of uniqueTags) {
    const tag = await tx.tag.upsert({
      where: { name },
      update: {},
      create: { name },
      select: { id: true },
    });
    tagRecords.push(tag);
  }

  return tagRecords;
}
