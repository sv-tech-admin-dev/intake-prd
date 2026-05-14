import { NextResponse } from "next/server";
import type { JsonValue } from "@/lib/intake/types";
import { saveProgressSchema } from "@/lib/intake/validation";
import { saveIntakeProgress } from "@/lib/intake/service";

export async function PATCH(request: Request, context: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await context.params;
  const body = await request.json();
  const parsed = saveProgressSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const submission = await saveIntakeProgress(submissionId, parsed.data.answers as Record<string, JsonValue>);
  return NextResponse.json({ submission });
}
