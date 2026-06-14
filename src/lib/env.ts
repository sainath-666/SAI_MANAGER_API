import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

const nodeEnv = process.env.NODE_ENV || "development";

// Load environment-specific file
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${nodeEnv}`),
});

// Fallback to default .env if specific file doesn't exist
dotenv.config();

const envSchema = z.object({
  SUPABASE_URL: z.string().url().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().optional().default(""),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.string().optional().default("development"),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => issue.path.join(".") || "env")
      .join(", ");
    throw new Error(`Missing or invalid environment variables: ${issues}`);
  }

  return parsed.data;
}
