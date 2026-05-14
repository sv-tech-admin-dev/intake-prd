import { appendAudit, persistGeneratedDocumentArtifacts, recordNotification } from "@/lib/intake/repository";
import { buildGenerationContext, generatePrdMarkdown } from "@/lib/intake/generation";
import { renderMarkdownToPdfBuffer } from "@/lib/pdf";
import type { GeneratedDocument, IntakeSubmission } from "./types";

export async function processGeneratedDocument(params: {
  document: GeneratedDocument;
  submission: IntakeSubmission;
}) {
  const context = buildGenerationContext(params.submission);
  const result = await generatePrdMarkdown(context);
  const pdfBuffer = renderMarkdownToPdfBuffer("Website Blueprint PRD", result.markdown);

  const updated = await persistGeneratedDocumentArtifacts({
    documentId: params.document.id,
    markdown: result.markdown,
    pdfBuffer,
    modelName: result.modelName,
    estimatedCostUsd: result.estimatedCostUsd,
  });

  try {
    await appendAudit({
      action: "prd_generation.completed",
      entityType: "document",
      entityId: params.document.id,
      metadata: {
        submissionId: params.submission.id,
        modelName: result.modelName,
        generationMode: result.generationMode,
      },
    });
  } catch {
    // Non-fatal: the document should still be usable even if audit logging is unavailable.
  }

  try {
    await recordNotification({
      submissionId: params.submission.id,
      generatedDocumentId: params.document.id,
      channel: "email",
      eventType: params.document.documentType === "readiness_report" ? "readiness_report_generated" : "prd_generated",
      status: "sent",
      message: `Generated ${params.document.documentType} for ${params.submission.projectName || params.submission.id}.`,
    });
  } catch {
    // Non-fatal: notification delivery can be retried later.
  }

  return updated;
}
