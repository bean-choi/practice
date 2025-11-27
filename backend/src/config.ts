import { z } from "zod";

const envSchema = z.object({
  // General
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),

  // Database
  DATABASE_URL: z.url().min(1),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(10),

  // Security
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  COOKIE_NAME: z.string().min(1).default("auth"),
  ALLOWED_ORIGINS: z
    .string()
    .optional()
    .transform(
      (value) =>
        value
          ?.split(",")
          .map((origin) => origin.trim())
          .filter(Boolean) ?? [],
    ),

  // AWS
  AWS_REGION: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_CLOUDFRONT_URL: z.url().optional(),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  MAX_UPLOAD_SIZE_MB: process.env.MAX_UPLOAD_SIZE_MB,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  COOKIE_NAME: process.env.COOKIE_NAME,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_CLOUDFRONT_URL: process.env.AWS_CLOUDFRONT_URL,
});
