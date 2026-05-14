import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { IntakeSubmission } from "@/lib/intake/types";

export function SubmissionTable({ submissions }: { submissions: IntakeSubmission[] }) {
  return (
    <Card className="overflow-hidden gap-0">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <tr>
            <th className="px-5 py-4">Project</th>
            <th className="px-5 py-4">Client</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Readiness</th>
            <th className="px-5 py-4">Updated</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id} className="border-t border-border">
              <td className="px-5 py-4">
                <Link href={`/admin/intake/${submission.id}`} className="font-heading font-medium text-foreground hover:underline">
                  {submission.projectName || "Untitled project"}
                </Link>
              </td>
              <td className="px-5 py-4 text-muted-foreground">{submission.clientName || "Unknown"}</td>
              <td className="px-5 py-4">
                <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs uppercase tracking-[0.16em] text-foreground">
                  {submission.status}
                </span>
              </td>
              <td className="px-5 py-4 text-muted-foreground">{submission.readinessScore}</td>
              <td className="px-5 py-4 text-muted-foreground">{new Date(submission.updatedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
