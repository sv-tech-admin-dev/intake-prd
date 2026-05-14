import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubmittedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <Card className="w-full max-w-xl gap-0 text-center">
        <CardHeader>
          <CardDescription className="text-xs uppercase tracking-[0.24em]">Submission received</CardDescription>
          <CardTitle className="font-heading mt-3 text-3xl">Your intake has been submitted.</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            The team can now review the submission, score readiness, and generate the blueprint and PRD artifacts.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link href="/">Back to home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/intake">Open admin review</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
