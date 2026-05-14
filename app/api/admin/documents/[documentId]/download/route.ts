import { NextResponse } from "next/server";
import { getCurrentUser, hasAdminAccess } from "@/lib/auth";
import { getDocumentDownload } from "@/lib/intake/service";
import { makeDocumentFilename } from "@/lib/intake/filename";

export async function GET(request: Request, context: { params: Promise<{ documentId: string }> }) {
  const user = await getCurrentUser();
  if (!hasAdminAccess(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await context.params;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "md" ? "md" : "pdf";
  const document = await getDocumentDownload(documentId);

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.status !== "ready") {
    return NextResponse.json({ error: "Document is not ready yet" }, { status: 409 });
  }

  const clientName = document.submission?.clientName || "Client";
  const projectName = document.submission?.projectName || "Website PRD";
  const documentLabel =
    document.documentType === "prd"
      ? "PRD"
      : document.documentType === "prd_with_assumptions"
        ? "PRD with assumptions"
        : "Readiness report";
  const filename = makeDocumentFilename(clientName, projectName, documentLabel, format);

  if (format === "md") {
    return new NextResponse(document.markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return new NextResponse(Buffer.from(document.pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
