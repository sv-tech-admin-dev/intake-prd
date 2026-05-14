import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import type { User } from "@supabase/supabase-js";

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function isAdminUser(user: User | null | undefined) {
  if (!user) return false;
  const metadata = { ...user.app_metadata, ...user.user_metadata } as Record<string, unknown>;
  return metadata.role === "admin" || metadata.is_admin === true;
}

export function hasAdminAccess(user: User | null | undefined) {
  if (env.demoAdminAccess) return true;
  return isAdminUser(user);
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user && !env.demoAdminAccess) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdminUser() {
  const user = await getCurrentUser();
  if (!hasAdminAccess(user) && !env.demoAdminAccess) {
    throw new Error("Forbidden");
  }
  return user;
}
