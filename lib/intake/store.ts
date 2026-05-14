import { intakeSchema } from "./schema";
import type {
  AuditLogEntry,
  GeneratedDocument,
  IntakeSubmission,
  NotificationLog,
  StoreSnapshot,
  SubmissionAnswerRecord,
} from "./types";
import { makeAuditEntry } from "@/lib/audit";
import { renderMarkdownToPdfBuffer } from "@/lib/pdf";

type StoreState = StoreSnapshot & {
  submissionIndex: Map<string, string>;
  documentIndex: Map<string, string>;
};

function createInitialSubmission(): IntakeSubmission {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    token: "demo-token",
    schemaVersion: intakeSchema.version,
    clientName: "Northstar Studio",
    projectName: "Client intake blueprint",
    contactEmail: "owner@northstar.studio",
    websiteType: "redesign",
    status: "draft",
    readinessScore: 74,
    owner: "Avery Chen",
    notes: ["Demo record preloaded for local development."],
    answers: [
      { questionId: "clientName", value: "Northstar Studio", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "projectName", value: "Client intake blueprint", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "contactEmail", value: "owner@northstar.studio", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "websiteType", value: "redesign", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "businessGoal", value: "Increase qualified website leads and cut briefing time.", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "successMetric", value: "Qualified leads, conversion rate and shorter intake cycles.", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "currentUrl", value: "https://northstar.studio", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_for_audit" },
      { questionId: "currentPainPoints", value: "The current site is slow to update and lacks a clear conversion path.", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "targetAudience", value: "Founders and operators who need a quick project intake process.", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "keyDifferentiator", value: "A guided intake that reduces back-and-forth.", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "pagesNeeded", value: "Home, services, about, intake, contact and FAQ.", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "contentReady", value: "partial", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "formsRequired", value: "yes", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "bookingRequired", value: "yes", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "paymentsRequired", value: "no", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "portalRequired", value: "no", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "bookingType", value: "Discovery call booking for qualified leads.", isVisibleAtSubmission: true, hiddenAnswerPolicy: "clear_when_hidden" },
      { questionId: "calendarTool", value: "Calendly", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "integrationsNeeded", value: "HubSpot, GA4, Slack notifications", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "seoImportant", value: "yes", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "redirectsNeeded", value: "Map old service URLs to new content structure.", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_for_audit" },
      { questionId: "accessibilityLevel", value: "wcag_aa", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "complianceNotes", value: "No special regulatory concerns.", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "launchDate", value: "2026-07-15", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "budgetRange", value: "25k_50k", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "owner", value: "Avery Chen", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "supportNeed", value: "Monthly support and content updates.", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
      { questionId: "notes", value: "Needs a faster intake experience than the current questionnaire.", isVisibleAtSubmission: true, hiddenAnswerPolicy: "retain_when_hidden" },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function createInitialDocument(submissionId: string): GeneratedDocument {
  const markdown = [
    "# Website Blueprint PRD",
    "",
    "## Summary",
    "This is a deterministic preview document generated from the intake blueprint.",
    "",
    "## Scope",
    "- Redesign with guided intake flow",
    "- Booking flow",
    "- SEO migration",
    "",
    "## Notes",
    "- Human review required before client handoff",
  ].join("\n");

  return {
    id: crypto.randomUUID(),
    submissionId,
    documentType: "prd_with_assumptions",
    status: "ready",
    markdown,
    pdfBuffer: renderMarkdownToPdfBuffer("Website Blueprint PRD", markdown),
    modelName: "mock-openai-responses",
    estimatedCostUsd: 0.21,
    createdAt: new Date().toISOString(),
  };
}

function makeState(): StoreState {
  const submission = createInitialSubmission();
  const document = createInitialDocument(submission.id);
  const notification: NotificationLog = {
    id: crypto.randomUUID(),
    submissionId: submission.id,
    generatedDocumentId: document.id,
    channel: "email",
    eventType: "prd_generated",
    status: "sent",
    message: "Review notification sent to internal team.",
    createdAt: new Date().toISOString(),
  };

  return {
    schema: intakeSchema,
    submissions: [submission],
    documents: [document],
    notifications: [notification],
    audit: [
      makeAuditEntry({
        action: "seed.created",
        entityType: "submission",
        entityId: submission.id,
        metadata: { token: submission.token },
      }),
    ],
    submissionIndex: new Map([[submission.token, submission.id]]),
    documentIndex: new Map([[document.id, document.id]]),
  };
}

declare global {
  var __intakePrdStore: StoreState | undefined;
}

export function getStore() {
  if (!globalThis.__intakePrdStore) {
    globalThis.__intakePrdStore = makeState();
  }
  return globalThis.__intakePrdStore;
}

export function getSnapshot(): StoreSnapshot {
  const store = getStore();
  return {
    schema: store.schema,
    submissions: store.submissions,
    documents: store.documents,
    notifications: store.notifications,
    audit: store.audit,
  };
}

export function listSubmissions() {
  return getStore().submissions.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSubmissionById(submissionId: string) {
  return getStore().submissions.find((submission) => submission.id === submissionId);
}

export function getSubmissionByToken(token: string) {
  const store = getStore();
  const submissionId = store.submissionIndex.get(token);
  if (!submissionId) {
    const now = new Date().toISOString();
    const submission: IntakeSubmission = {
      id: crypto.randomUUID(),
      token,
      schemaVersion: store.schema.version,
      clientName: "",
      projectName: "",
      contactEmail: "",
      websiteType: "new_website",
      status: "draft",
      readinessScore: 0,
      owner: "",
      notes: [],
      answers: [],
      createdAt: now,
      updatedAt: now,
    };
    store.submissions.push(submission);
    store.submissionIndex.set(token, submission.id);
    store.audit.push(
      makeAuditEntry({
        action: "intake.link.created",
        entityType: "submission",
        entityId: submission.id,
        metadata: { token },
      })
    );
    return submission;
  }
  return getSubmissionById(submissionId);
}

export function saveSubmissionAnswers(submissionId: string, answers: SubmissionAnswerRecord[], fields: Partial<IntakeSubmission>) {
  const store = getStore();
  const submission = getSubmissionById(submissionId);
  if (!submission) throw new Error("Submission not found");

  submission.answers = answers;
  submission.clientName = fields.clientName ?? submission.clientName;
  submission.projectName = fields.projectName ?? submission.projectName;
  submission.contactEmail = fields.contactEmail ?? submission.contactEmail;
  submission.websiteType = (fields.websiteType ?? submission.websiteType) as IntakeSubmission["websiteType"];
  submission.readinessScore = fields.readinessScore ?? submission.readinessScore;
  submission.owner = fields.owner ?? submission.owner;
  submission.updatedAt = new Date().toISOString();

  store.audit.push(
    makeAuditEntry({
      action: "intake.progress_saved",
      entityType: "submission",
      entityId: submission.id,
      metadata: { answerCount: answers.length },
    })
  );

  return submission;
}

export function addSubmissionNote(submissionId: string, note: string) {
  const submission = getSubmissionById(submissionId);
  if (!submission) throw new Error("Submission not found");
  submission.notes = [...submission.notes, note];
  submission.updatedAt = new Date().toISOString();
  getStore().audit.push(
    makeAuditEntry({
      action: "admin.note_added",
      entityType: "submission",
      entityId: submission.id,
      metadata: { note },
    })
  );
  return submission;
}

export function submitSubmission(submissionId: string, readinessScore: number) {
  const submission = getSubmissionById(submissionId);
  if (!submission) throw new Error("Submission not found");
  submission.status = "submitted";
  submission.readinessScore = readinessScore;
  submission.submittedAt = new Date().toISOString();
  submission.updatedAt = submission.submittedAt;
  getStore().audit.push(
    makeAuditEntry({
      action: "intake.submitted",
      entityType: "submission",
      entityId: submission.id,
      metadata: { readinessScore },
    })
  );
  return submission;
}

export function createGeneratedDocument(params: {
  submissionId: string;
  documentType: GeneratedDocument["documentType"];
  markdown: string;
  modelName: string;
  estimatedCostUsd: number;
}) {
  const store = getStore();
  const doc: GeneratedDocument = {
    id: crypto.randomUUID(),
    submissionId: params.submissionId,
    documentType: params.documentType,
    status: "ready",
    markdown: params.markdown,
    pdfBuffer: renderMarkdownToPdfBuffer("Website Blueprint PRD", params.markdown),
    modelName: params.modelName,
    estimatedCostUsd: params.estimatedCostUsd,
    createdAt: new Date().toISOString(),
  };
  store.documents.push(doc);
  store.documentIndex.set(doc.id, doc.id);
  store.audit.push(
    makeAuditEntry({
      action: "prd_generation.completed",
      entityType: "document",
      entityId: doc.id,
      metadata: { submissionId: doc.submissionId, documentType: doc.documentType },
    })
  );
  return doc;
}

export function getDocumentById(documentId: string) {
  return getStore().documents.find((document) => document.id === documentId);
}

export function recordNotification(notification: Omit<NotificationLog, "id" | "createdAt">) {
  const store = getStore();
  const record: NotificationLog = {
    ...notification,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  store.notifications.push(record);
  store.audit.push(
    makeAuditEntry({
      action: record.status === "sent" ? "notification.sent" : "notification.failed",
      entityType: "notification",
      entityId: record.id,
      metadata: { submissionId: record.submissionId, eventType: record.eventType },
    })
  );
  return record;
}

export function appendAudit(entry: Omit<AuditLogEntry, "id" | "createdAt">) {
  const store = getStore();
  const audit = makeAuditEntry(entry);
  store.audit.push(audit);
  return audit;
}
