import { claimNextGeneratedDocument, getSubmissionById, markGeneratedDocumentFailed } from "@/lib/intake/repository";
import { processGeneratedDocument } from "@/lib/intake/generation-runner";

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

  try {
    await processGeneratedDocument({
      document,
      submission,
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
