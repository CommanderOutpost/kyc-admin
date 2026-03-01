import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(12),
  WEBHOOK_SECRET: z.string().min(8),
  BCRYPT_ROUNDS: z.coerce.number().default(10),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),
  DEFAULT_ADMIN_EMAIL: z.string().email().default("admin@fonu.test"),
  DEFAULT_ADMIN_PASSWORD: z.string().min(8).default("Password123")
});

export const env = envSchema.parse(process.env);
