import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "@/components/auth/sign-in-form";
import { env } from "@/lib/env";
import { isSupabaseConfigured } from "@/lib/auth";

export default function LoginPage() {
  const callbackUrl = new URL("/auth/callback", env.appUrl);
  callbackUrl.searchParams.set("next", "/admin/intake");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Intake PRD</p>
            <h1 className="font-heading text-3xl font-semibold">Admin sign in</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">Back home</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="gap-0">
            <CardHeader>
              <CardDescription className="text-xs uppercase tracking-[0.24em]">Access control</CardDescription>
              <CardTitle className="font-heading mt-2 text-2xl">Supabase authentication</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Use a magic link to open the protected admin area. The server validates the session on every request.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Configured: {isSupabaseConfigured() ? "yes" : "no"}</p>
              <p>Redirect target: /admin/intake</p>
              {!isSupabaseConfigured() ? (
                <p>
                  Supabase env vars are not set, so the app is running in demo mode. You can continue to the admin
                  area without signing in while developing locally.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {isSupabaseConfigured() ? (
            <SignInForm
              redirectTo={callbackUrl.toString()}
              supabaseUrl={env.supabaseUrl}
              supabaseAnonKey={env.supabaseAnonKey}
            />
          ) : (
            <Card className="gap-0">
              <CardHeader>
                <CardDescription className="text-xs uppercase tracking-[0.24em]">Demo mode</CardDescription>
                <CardTitle className="font-heading mt-2 text-2xl">No Supabase config detected</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Set the Supabase environment variables to enable real authentication. For now the local workspace
                  keeps demo access enabled.
                </p>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/intake">Open admin review</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
