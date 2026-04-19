import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const EXT_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function effectiveMimeType(file: File) {
  if (ALLOWED_TYPES.has(file.type)) return file.type;
  const ext = path.extname(file.name).toLowerCase();
  const inferred = EXT_TO_MIME[ext];
  if (
    inferred &&
    (file.type === "" || file.type === "application/octet-stream" || file.type === "binary/octet-stream")
  ) {
    return inferred;
  }
  return file.type;
}

export async function POST(request: Request) {
  const env = getEnv();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const mimeType = effectiveMimeType(file);
  if (!ALLOWED_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: "Unsupported file type", detail: mimeType || "(empty MIME — PDF/PNG/JPG/WEBP/GIF만 허용)" },
      { status: 400 },
    );
  }

  const maxBytes = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const ext = path.extname(file.name) || "";
  const storedName = `${Date.now()}-${randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, storedName), buffer, { flag: "wx" });

  return NextResponse.json({
    original: file.name,
    storedName,
    mimeType,
    size: file.size,
  });
}
