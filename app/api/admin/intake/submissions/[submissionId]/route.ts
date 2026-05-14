import { NextResponse } from "next/server";
import { getCurrentUser, hasAdminAccess } from "@/lib/auth";
import { getSubmissionDetail } from "@/lib/intake/service";

export async function GET(_request: Request, context: { params: Promise<{ submissionId: string }> }) {
  const user = await getCurrentUser();
  if (!hasAdminAccess(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { submissionId } = await context.params;
  const detail = await getSubmissionDetail(submissionId);
  if (!detail) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
