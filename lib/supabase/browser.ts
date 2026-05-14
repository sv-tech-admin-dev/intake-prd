import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseBrowserClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
