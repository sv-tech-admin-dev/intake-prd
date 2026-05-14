import { appendAudit, claimNextGeneratedDocument, getSubmissionById, markGeneratedDocumentFailed, persistGeneratedDocumentArtifacts, recordNotification } from "@/lib/intake/repository";
import { buildGenerationContext, generatePrdMarkdown } from "@/lib/intake/generation";
import { renderMarkdownToPdfBuffer } from "@/lib/pdf";

const pollIntervalMs = Number(process.env.GENERATION_WORKER_POLL_MS ?? 5000);
const runOnce = process.argv.includes("--once") || process.env.GENERATION_WORKER_ONCE === "true";

async function main() {
  console.log(`Generation worker started (poll=${pollIntervalMs}ms, once=${runOnce ? "yes" : "no"})`);

  while (true) {
    const processed = await processOneQueuedDocument();
    if (runOnce) break;
    if (!processed) {
      await sleep(pollIntervalMs);
    }
  }

  console.log("Generation worker exited.");
}

async function processOneQueuedDocument() {
  const document = await claimNextGeneratedDocument();
  if (!document) {
    return false;
  }

  const submission = await getSubmissionById(document.submissionId);
  if (!submission) {
    await markGeneratedDocumentFailed(document.id, "Submission not found for queued generation job.");
    return true;
  }

  const context = buildGenerationContext(submission);

  try {
    const result = await generatePrdMarkdown(context);
    const pdfBuffer = renderMarkdownToPdfBuffer("Website Blueprint PRD", result.markdown);
    await persistGeneratedDocumentArtifacts({
      documentId: document.id,
      markdown: result.markdown,
      pdfBuffer,
      modelName: result.modelName,
      estimatedCostUsd: result.estimatedCostUsd,
    });

    await appendAudit({
      action: "prd_generation.completed",
      entityType: "document",
      entityId: document.id,
      metadata: {
        submissionId: submission.id,
        modelName: result.modelName,
        generationMode: result.generationMode,
      },
    });

    await recordNotification({
      submissionId: submission.id,
      generatedDocumentId: document.id,
      channel: "email",
      eventType: document.documentType === "readiness_report" ? "readiness_report_generated" : "prd_generated",
      status: "sent",
      message: `Generated ${document.documentType} for ${submission.projectName || submission.id}.`,
    });

    console.log(`Generated ${document.documentType} for submission ${submission.id}.`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error";
    await markGeneratedDocumentFailed(document.id, message);
    console.error(`Failed to generate document ${document.id}: ${message}`);
    return true;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
