import { calculateReadiness, buildAnswerMap } from "./readiness";
import { getVisibleQuestions } from "./logic";
import type { IntakeSubmission, JsonValue, SubmissionAnswerRecord } from "./types";
import { intakeSchema } from "./schema";
import {
  addSubmissionNote as addSubmissionNoteToRepository,
  createGeneratedDocument,
  getDocumentById,
  getSnapshot,
  getSubmissionById,
  getSubmissionByToken,
  recordNotification,
  saveSubmissionAnswers,
  submitSubmission,
} from "./repository";

function answerMapFromSubmission(submission: IntakeSubmission) {
  return buildAnswerMap(submission.answers);
}

function toSubmissionFields(answerMap: Record<string, JsonValue>) {
  return {
    clientName: String(answerMap.clientName ?? ""),
    projectName: String(answerMap.projectName ?? ""),
    contactEmail: String(answerMap.contactEmail ?? ""),
    websiteType: String(answerMap.websiteType ?? "new_website") as IntakeSubmission["websiteType"],
    owner: String(answerMap.owner ?? ""),
  };
}

export async function loadIntakeByToken(token: string) {
  const submission = await getSubmissionByToken(token);
  if (!submission) throw new Error("Submission not found");
  const answerMap = answerMapFromSubmission(submission);
  return {
    schema: intakeSchema,
    submission,
    visibleQuestions: getVisibleQuestions(intakeSchema, answerMap),
    answers: answerMap,
  };
}

export async function saveIntakeProgress(submissionId: string, answers: Record<string, JsonValue>) {
  const submission = await getSubmissionById(submissionId);
  if (!submission) throw new Error("Submission not found");
  const visible = getVisibleQuestions(intakeSchema, answers);
  const visibleIds = new Set(visible.map((question) => question.id));
  const answerRecords: SubmissionAnswerRecord[] = Object.entries(answers)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([questionId, value]) => {
      const question = intakeSchema.questions.find((item) => item.id === questionId);
      return {
        questionId,
        value,
        isVisibleAtSubmission: visibleIds.has(questionId),
        hiddenAnswerPolicy: question?.hiddenAnswerPolicy ?? "retain_when_hidden",
      };
    });

  return saveSubmissionAnswers(submissionId, answerRecords, toSubmissionFields(answers));
}

export async function submitIntake(submissionId: string) {
  const submission = await getSubmissionById(submissionId);
  if (!submission) throw new Error("Submission not found");
  const readiness = calculateReadiness(intakeSchema, submission.answers);
  const saved = await submitSubmission(submissionId, readiness.score);
  const documentType =
    readiness.outcome === "prd"
      ? "prd"
      : readiness.outcome === "prd_with_assumptions"
        ? "prd_with_assumptions"
        : "readiness_report";

  const summary = buildSummary(saved, readiness);
  const generated = await createGeneratedDocument({
    submissionId: saved.id,
    documentType,
    markdown: summary,
    modelName: "mock-openai-responses",
    estimatedCostUsd: documentType === "prd" ? 0.42 : 0.18,
  });

  await recordNotification({
    submissionId: saved.id,
    generatedDocumentId: generated.id,
    channel: "email",
    eventType: documentType === "readiness_report" ? "readiness_report_generated" : "prd_generated",
    status: "sent",
    message: `Internal delivery queued for ${saved.projectName || saved.id}.`,
  });

  return {
    submission: saved,
    readiness,
    document: {
      id: generated.id,
      submissionId: generated.submissionId,
      documentType: generated.documentType,
      status: generated.status,
      markdown: generated.markdown,
      modelName: generated.modelName,
      estimatedCostUsd: generated.estimatedCostUsd,
      createdAt: generated.createdAt,
    },
  };
}

function buildSummary(submission: IntakeSubmission, readiness: ReturnType<typeof calculateReadiness>) {
  const answerMap = answerMapFromSubmission(submission);
  const visibleQuestions = getVisibleQuestions(intakeSchema, answerMap);

  const lines = [
    "# Website Blueprint PRD",
    "",
    "## Summary",
    `- Client: ${submission.clientName}`,
    `- Project: ${submission.projectName}`,
    `- Readiness score: ${readiness.score}`,
    `- Outcome: ${readiness.outcome}`,
    "",
    "## Key Inputs",
    ...visibleQuestions.map((question) => `- ${question.label}: ${String(answerMap[question.id] ?? "Not provided")}`),
    "",
    "## Missing Fields",
    ...(readiness.missingFields.length > 0
      ? readiness.missingFields.map((item) => `- ${item.label} (${item.severity})`)
      : ["- None"]),
    "",
    "## Risk Flags",
    ...(readiness.riskFlags.length > 0 ? readiness.riskFlags.map((flag) => `- ${flag}`) : ["- None"]),
    "",
    "## Review Notes",
    "- Human review required before client handoff.",
  ];

  return lines.join("\n");
}

export async function getAdminDashboardData() {
  const snapshot = await getSnapshot();

  return {
    schema: snapshot.schema,
    submissions: snapshot.submissions,
    documents: snapshot.documents.map((document) => ({
      id: document.id,
      submissionId: document.submissionId,
      documentType: document.documentType,
      status: document.status,
      markdown: document.markdown,
      modelName: document.modelName,
      estimatedCostUsd: document.estimatedCostUsd,
      createdAt: document.createdAt,
    })),
    notifications: snapshot.notifications,
    audit: snapshot.audit.slice(0, 100),
  };
}

export async function getSubmissionDetail(submissionId: string) {
  const snapshot = await getSnapshot();
  const submission = snapshot.submissions.find((item) => item.id === submissionId) ?? (await getSubmissionById(submissionId));
  if (!submission) return null;
  const readiness = calculateReadiness(intakeSchema, submission.answers);

  return {
    submission,
    readiness,
    documents: snapshot.documents
      .filter((document) => document.submissionId === submission.id)
      .map((document) => ({
        id: document.id,
        submissionId: document.submissionId,
        documentType: document.documentType,
        status: document.status,
        markdown: document.markdown,
        modelName: document.modelName,
        estimatedCostUsd: document.estimatedCostUsd,
        createdAt: document.createdAt,
      })),
    notifications: snapshot.notifications.filter((item) => item.submissionId === submission.id),
  };
}

export async function getDocumentDownload(documentId: string) {
  const document = await getDocumentById(documentId);
  if (!document) return null;
  return document;
}

export async function addSubmissionNote(submissionId: string, note: string) {
  return addSubmissionNoteToRepository(submissionId, note);
}
