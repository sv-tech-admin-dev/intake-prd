import { NextResponse } from "next/server";
import { submitSchema } from "@/lib/intake/validation";
import { submitIntake } from "@/lib/intake/service";

export async function POST(request: Request, context: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await context.params;
  const body = await request.json();
  const parsed = submitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await submitIntake(submissionId);
  return NextResponse.json(result);
}
