import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { env } from "@/lib/env";
import { getAdminDashboardData } from "@/lib/intake/service";

export default async function HomePage() {
  const dashboard = await getAdminDashboardData();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Intake PRD</p>
            <h1 className="font-heading text-xl font-semibold">Dynamic website intake and PRD generation</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href={`/intake/${env.demoPublicToken}`}>Open demo intake</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/intake">Open admin review</Link>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-border bg-muted px-4 py-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Schema-driven intake, readiness scoring, secure exports
            </p>
            <h2 className="font-heading mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
              Replace static questionnaires with a guided intake that actually produces a usable PRD.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              This workspace implements the foundation from the architecture plan: conditional intake, visibility rules,
              admin review, readiness scoring, document generation, and an audit-friendly data model.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/intake/${env.demoPublicToken}`}>Start intake flow</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/intake">Review submissions</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <MetricCard title="Submissions" value={dashboard.submissions.length} note="Current demo dataset" />
            <MetricCard title="Generated documents" value={dashboard.documents.length} note="Markdown and PDF outputs" />
            <MetricCard title="Notifications" value={dashboard.notifications.length} note="Internal delivery log" />
            <MetricCard title="Audit events" value={dashboard.audit.length} note="Lifecycle and admin actions" />
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ title, value, note }: { title: string; value: number; note: string }) {
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardDescription className="text-xs uppercase tracking-[0.24em]">{title}</CardDescription>
        <CardTitle className="font-heading text-4xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
