// Loads and validates environment variables at process startup.
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(10),
  SENDGRID_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  APP_URL: z.string().url(),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  COOKIE_SECURE: z.string().optional(),
  MEDIA_ROOT: z.string().min(1),
  MAX_UPLOAD_MB: z.coerce.number().default(25),
  INVITE_EXPIRES_DAYS: z.coerce.number().default(7),
  SHARE_EXPIRES_HOURS: z.coerce.number().default(24),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast with a readable list so misconfiguration is obvious.
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid environment variables:\n${issues.join("\n")}`);
}

const data = parsed.data;

export const env = {
  ...data,
  // Keep booleans and byte limits normalized for runtime use.
  COOKIE_SECURE: data.COOKIE_SECURE === "true",
  MAX_UPLOAD_BYTES: data.MAX_UPLOAD_MB * 1024 * 1024
};
