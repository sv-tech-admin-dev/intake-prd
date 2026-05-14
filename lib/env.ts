import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_JWT_SECRET: z.string().min(1).optional(),
  DEMO_ADMIN_ACCESS: z.string().optional(),
  DEMO_PUBLIC_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
const hasSupabaseConfig = Boolean(
  parsed.success &&
    parsed.data.NEXT_PUBLIC_SUPABASE_URL &&
    (parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY)
);

export const env = {
  appUrl: parsed.success ? parsed.data.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" : "http://localhost:3000",
  supabaseUrl: parsed.success ? parsed.data.NEXT_PUBLIC_SUPABASE_URL ?? "" : "",
  supabaseAnonKey: parsed.success
    ? parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    : "",
  supabaseServiceRoleKey: parsed.success ? parsed.data.SUPABASE_SERVICE_ROLE_KEY ?? "" : "",
  supabaseJwtSecret: parsed.success ? parsed.data.SUPABASE_JWT_SECRET ?? "" : "",
  demoAdminAccess: parsed.success ? parsed.data.DEMO_ADMIN_ACCESS === "true" || !hasSupabaseConfig : true,
  demoPublicToken: parsed.success ? parsed.data.DEMO_PUBLIC_TOKEN ?? "demo-token" : "demo-token",
};
