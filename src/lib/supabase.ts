import { createClient } from "@supabase/supabase-js";
import { getEnv } from "./env.js";
import type { Database } from "./database.js";

let cachedAdminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getAdminClient() {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  const env = getEnv();
  cachedAdminClient = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  return cachedAdminClient;
}
