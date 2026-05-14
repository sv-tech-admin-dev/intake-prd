import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubmissionTable } from "@/components/admin/submission-table";
import { getCurrentUser, hasAdminAccess } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/intake/service";

export default function AdminIntakePage() {
  return renderAdminPage();
}

async function renderAdminPage() {
  const user = await getCurrentUser();
  if (!hasAdminAccess(user)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <Card className="w-full max-w-xl gap-0">
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-[0.24em]">Admin access required</CardDescription>
            <CardTitle className="font-heading mt-2 text-2xl">Sign in with Supabase Auth</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              The admin review area is protected by Supabase authentication. Add an admin session or enable demo access
              for local development.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/login">Go to sign in</Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const { submissions, notifications, audit } = await getAdminDashboardData();

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Card className="gap-0">
          <CardHeader>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <CardDescription className="text-xs uppercase tracking-[0.24em]">Admin review</CardDescription>
                <CardTitle className="font-heading mt-2 text-3xl">Submissions</CardTitle>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  Review readiness, inspect generated artifacts, and confirm whether a submission can move forward.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/">Home</Link>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard title="Submissions" value={submissions.length} />
          <StatCard title="Notifications" value={notifications.length} />
          <StatCard title="Audit events" value={audit.length} />
        </section>

        <section className="mt-6">
          <SubmissionTable submissions={submissions} />
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardDescription className="text-xs uppercase tracking-[0.24em]">{title}</CardDescription>
        <CardTitle className="font-heading text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
