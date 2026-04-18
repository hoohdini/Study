import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(12),
  AUTH_SECRET: z.string().min(32),
  BASE_URL: z.string().url().default("http://localhost:3000"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(10),
});

export function getEnv() {
  return envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    AUTH_SECRET: process.env.AUTH_SECRET,
    BASE_URL: process.env.BASE_URL,
    MAX_UPLOAD_SIZE_MB: process.env.MAX_UPLOAD_SIZE_MB,
  });
}
