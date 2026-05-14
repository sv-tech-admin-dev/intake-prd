import { NextResponse } from "next/server";
import { getCurrentUser, hasAdminAccess } from "@/lib/auth";
import { submitIntake } from "@/lib/intake/service";

export async function POST(_request: Request, context: { params: Promise<{ submissionId: string }> }) {
  const user = await getCurrentUser();
  if (!hasAdminAccess(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { submissionId } = await context.params;
  const result = await submitIntake(submissionId);
  return NextResponse.json(result);
}
