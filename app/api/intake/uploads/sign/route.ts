import { NextResponse } from "next/server";
import { signedUploadSchema } from "@/lib/intake/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signedUploadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  return NextResponse.json({
    uploadUrl: `https://example.invalid/upload/${encodeURIComponent(parsed.data.fileName)}`,
    objectKey: `intake/uploads/${crypto.randomUUID()}-${parsed.data.fileName}`,
    expiresInSeconds: 600,
  });
}
