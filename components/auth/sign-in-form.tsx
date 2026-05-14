"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setMessage("Check your email for the Supabase sign-in link.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-lg gap-0">
      <CardHeader>
        <CardDescription className="text-xs uppercase tracking-[0.24em]">Supabase auth</CardDescription>
        <CardTitle className="font-heading mt-2 text-2xl">Sign in to admin</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send a magic link through Supabase Auth.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-foreground"
              autoComplete="email"
              required
            />
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-foreground">{message}</p> : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Sending link..." : "Send sign-in link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
