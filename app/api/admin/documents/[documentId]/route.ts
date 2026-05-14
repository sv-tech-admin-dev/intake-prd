import { NextResponse } from "next/server";
import { getCurrentUser, hasAdminAccess } from "@/lib/auth";
import { deleteGeneratedDocument, getDocumentById } from "@/lib/intake/repository";

export async function DELETE(_request: Request, context: { params: Promise<{ documentId: string }> }) {
  const user = await getCurrentUser();
  if (!hasAdminAccess(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await context.params;
  const existing = await getDocumentById(documentId);
  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await deleteGeneratedDocument(documentId);
  return NextResponse.json({ ok: true });
}
