import { NextResponse } from "next/server";
import { getCurrentUser, hasAdminAccess } from "@/lib/auth";
import { notificationTestSchema } from "@/lib/intake/validation";
import { recordNotification } from "@/lib/intake/repository";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!hasAdminAccess(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = notificationTestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid notification test payload" }, { status: 400 });
  }

  const record = await recordNotification({
    submissionId: "test",
    channel: "email",
    eventType: "prd_generated",
    status: "sent",
    message: `Test notification queued for ${parsed.data.recipient}`,
  });

  return NextResponse.json({ ok: true, record });
}
