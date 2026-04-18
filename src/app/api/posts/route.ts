import { Category } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildUniqueSlug, upsertTags } from "@/lib/posts";

const postSchema = z.object({
  title: z.string().min(3).max(140),
  summary: z.string().min(10).max(400),
  content: z.string().min(30),
  category: z.nativeEnum(Category),
  tags: z.array(z.string()).default([]),
  attachments: z
    .array(
      z.object({
        original: z.string(),
        storedName: z.string(),
        mimeType: z.string(),
        size: z.number().int().positive(),
      }),
    )
    .default([]),
});

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { publishedAt: "desc" },
    include: { tags: { include: { tag: true } }, attachments: true },
  });
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = postSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  const slug = await buildUniqueSlug(data.title);

  const post = await prisma.$transaction(async (tx) => {
    const tagRecords = await upsertTags(tx, data.tags);
    return tx.post.create({
      data: {
        title: data.title,
        slug,
        summary: data.summary,
        content: data.content,
        category: data.category,
        publishedAt: new Date(),
        tags: {
          create: tagRecords.map((tag) => ({ tagId: tag.id })),
        },
        attachments: {
          create: data.attachments.map((attachment) => ({
            original: attachment.original,
            storedName: attachment.storedName,
            mimeType: attachment.mimeType,
            size: attachment.size,
          })),
        },
      },
    });
  });

  return NextResponse.json(post, { status: 201 });
}
