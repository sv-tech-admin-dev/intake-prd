import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TestPrdGenerationButton } from "@/components/admin/test-prd-generation-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser, hasAdminAccess } from "@/lib/auth";
import { addSubmissionNote, getSubmissionDetail, submitIntake } from "@/lib/intake/service";
import { revalidatePath } from "next/cache";

export default async function AdminSubmissionPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  const user = await getCurrentUser();
  if (!hasAdminAccess(user)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <Card className="w-full max-w-xl gap-0">
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-[0.24em]">Admin access required</CardDescription>
            <CardTitle className="font-heading mt-2 text-2xl">Sign in with Supabase Auth</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              This submission detail page is only available to authenticated admin users.
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

  const detail = await getSubmissionDetail(submissionId);

  if (!detail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Card>
          <CardContent className="p-8">
            <p>Submission not found.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  async function onGenerate() {
    "use server";
    await submitIntake(submissionId);
    revalidatePath(`/admin/intake/${submissionId}`);
    revalidatePath("/admin/intake");
  }

  async function onNote() {
    "use server";
    await addSubmissionNote(submissionId, "Reviewed during admin pass.");
    revalidatePath(`/admin/intake/${submissionId}`);
    revalidatePath("/admin/intake");
  }

  const { submission, readiness, documents, notifications } = detail;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Card className="gap-0">
          <CardHeader>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <CardDescription className="text-xs uppercase tracking-[0.24em]">Submission detail</CardDescription>
                <CardTitle className="font-heading mt-2 text-3xl">
                  {submission.projectName || "Untitled project"}
                </CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">{submission.clientName || "Unknown client"}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/admin/intake">Back</Link>
                </Button>
                <TestPrdGenerationButton submissionId={submissionId} />
                <form action={onGenerate}>
                  <Button type="submit">Generate PRD</Button>
                </form>
              </div>
            </div>
          </CardHeader>
        </Card>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <MetricCard title="Status" value={submission.status} />
          <MetricCard title="Readiness" value={`${readiness.score}`} />
          <MetricCard title="Document type" value={documents[0]?.documentType ?? "none"} />
          <MetricCard title="Notifications" value={`${notifications.length}`} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="gap-0">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Readiness</CardTitle>
              <CardDescription>Outcome: {readiness.outcome}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <InfoList title="Missing fields" items={readiness.missingFields.map((item) => `${item.label} (${item.severity})`)} />
                <InfoList title="Critical blockers" items={readiness.criticalBlockers} />
                <InfoList title="Risk flags" items={readiness.riskFlags} />
                <InfoList title="Follow-up" items={readiness.followUpQuestions} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="gap-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading text-xl">Generated documents</CardTitle>
                  {documents.length > 0 ? (
                    <Button variant="outline" asChild>
                      <Link href={`/api/admin/documents/${documents[0].id}/download?format=md`}>Download markdown</Link>
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {documents.map((document) => (
                  <div key={document.id} className="rounded-2xl border border-border bg-muted/40 p-4">
                    <p className="font-medium">{document.documentType}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Model: {document.modelName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Estimated cost: ${document.estimatedCostUsd.toFixed(2)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="gap-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading text-xl">Internal notes</CardTitle>
                  <form action={onNote}>
                    <Button type="submit" variant="outline">
                      Add note
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {submission.notes.map((note, index) => (
                  <p
                    key={`${submission.id}-note-${index}`}
                    className="rounded-2xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground"
                  >
                    {note}
                  </p>
                ))}
              </CardContent>
            </Card>

            <Card className="gap-0">
              <CardHeader>
                <CardTitle className="font-heading text-xl">Notification log</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {notifications.map((notification) => (
                  <div key={notification.id} className="rounded-2xl border border-border bg-muted/40 p-3 text-sm">
                    <p className="font-medium">{notification.eventType}</p>
                    <p className="text-muted-foreground">{notification.status}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.75rem] border border-border bg-card p-5 text-card-foreground shadow-sm">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{title}</p>
      <p className="mt-3 font-heading text-lg font-semibold">{value}</p>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <div className="mt-2 space-y-1 text-sm text-foreground">
        {items.length > 0 ? items.map((item) => <p key={item}>- {item}</p>) : <p>- None</p>}
      </div>
    </div>
  );
}
