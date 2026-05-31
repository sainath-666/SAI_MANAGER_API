import dotenv from "dotenv";
import { z } from "zod";

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
