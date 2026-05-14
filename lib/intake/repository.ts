import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json as SupabaseJson } from "@/lib/supabase/database.types";
import { env } from "@/lib/env";
import { isSupabaseConfigured } from "@/lib/auth";
import { getDocumentById as getDemoDocumentById, getSnapshot as getDemoSnapshot, getSubmissionById as getDemoSubmissionById, getSubmissionByToken as getDemoSubmissionByToken, listSubmissions as listDemoSubmissions, addSubmissionNote as addDemoSubmissionNote, appendAudit as appendDemoAudit, createGeneratedDocument as createDemoGeneratedDocument, recordNotification as recordDemoNotification, saveSubmissionAnswers as saveDemoSubmissionAnswers, submitSubmission as submitDemoSubmission } from "@/lib/intake/store";
import type {
  AuditLogEntry,
  GeneratedDocument,
  IntakeSubmission,
  JsonValue,
  NotificationLog,
  StoreSnapshot,
  SubmissionAnswerRecord,
} from "@/lib/intake/types";
import { renderMarkdownToPdfBuffer } from "@/lib/pdf";

type SubmissionRow = {
  id: string;
  token: string;
  schema_version: string;
  client_name: string;
  project_name: string;
  contact_email: string;
  website_type: IntakeSubmission["websiteType"];
  status: IntakeSubmission["status"];
  readiness_score: number;
  owner: string;
  notes: string[] | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

type AnswerRow = {
  submission_id: string;
  question_id: string;
  answer_value: JsonValue;
  is_visible_at_submission: boolean;
  hidden_answer_policy: SubmissionAnswerRecord["hiddenAnswerPolicy"];
};

type DocumentRow = {
  id: string;
  submission_id: string;
  document_type: GeneratedDocument["documentType"];
  status: GeneratedDocument["status"];
  markdown_content: string;
  model_name: string | null;
  estimated_cost_usd: string | number;
  created_at: string;
};

type NotificationRow = {
  id: string;
  submission_id: string;
  generated_document_id: string | null;
  channel: NotificationLog["channel"];
  event_type: NotificationLog["eventType"];
  status: NotificationLog["status"];
  message: string;
  created_at: string;
};

type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function db() {
  return createSupabaseAdminClient();
}

function hasSupabaseRepositoryAccess() {
  return isSupabaseConfigured() && Boolean(env.supabaseServiceRoleKey);
}

function mapSubmission(row: SubmissionRow, answers: SubmissionAnswerRecord[] = []): IntakeSubmission {
  return {
    id: row.id,
    token: row.token,
    schemaVersion: row.schema_version,
    clientName: row.client_name,
    projectName: row.project_name,
    contactEmail: row.contact_email,
    websiteType: row.website_type,
    status: row.status,
    readinessScore: row.readiness_score,
    owner: row.owner,
    notes: row.notes ?? [],
    answers,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at ?? undefined,
  };
}

function mapAnswer(row: AnswerRow): SubmissionAnswerRecord {
  return {
    questionId: row.question_id,
    value: row.answer_value,
    isVisibleAtSubmission: row.is_visible_at_submission,
    hiddenAnswerPolicy: row.hidden_answer_policy,
  };
}

function mapDocument(row: DocumentRow): GeneratedDocument {
  return {
    id: row.id,
    submissionId: row.submission_id,
    documentType: row.document_type,
    status: row.status,
    markdown: row.markdown_content,
    pdfBuffer: renderMarkdownToPdfBuffer("Website Blueprint PRD", row.markdown_content),
    modelName: row.model_name ?? "openai",
    estimatedCostUsd: Number(row.estimated_cost_usd),
    createdAt: row.created_at,
  };
}

function mapNotification(row: NotificationRow): NotificationLog {
  return {
    id: row.id,
    submissionId: row.submission_id,
    generatedDocumentId: row.generated_document_id ?? undefined,
    channel: row.channel,
    eventType: row.event_type,
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
  };
}

function mapAudit(row: AuditRow): AuditLogEntry {
  return {
    id: row.id,
    actorId: row.actor_id ?? undefined,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  };
}

async function fetchSubmissionAnswers(submissionId: string) {
  const client = db();
  const { data, error } = await client
    .from("intake_answers")
    .select("submission_id, question_id, answer_value, is_visible_at_submission, hidden_answer_policy")
    .eq("submission_id", submissionId)
    .order("question_id", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapAnswer(row as AnswerRow));
}

async function writeAudit(entry: Omit<AuditLogEntry, "id" | "createdAt">) {
  if (!isSupabaseConfigured()) {
    return appendDemoAudit(entry);
  }

  const client = db();
  const { data, error } = await client
    .from("audit_logs")
    .insert({
      actor_id: entry.actorId ?? null,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      metadata: entry.metadata ? (entry.metadata as SupabaseJson) : null,
    })
    .select("*")
    .single();
  if (error) throw error;

  return mapAudit(data as AuditRow);
}

export async function getSubmissionByToken(token: string) {
  if (!hasSupabaseRepositoryAccess()) {
    return getDemoSubmissionByToken(token) ?? null;
  }

  const client = db();
  const { data: existing, error: existingError } = await client
    .from("intake_submissions")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (existingError) throw existingError;

  if (!existing) {
    const now = new Date().toISOString();
    const { data: inserted, error: insertError } = await client
      .from("intake_submissions")
      .insert({
        token,
        schema_version: "1.0.0",
        client_name: "",
        project_name: "",
        contact_email: "",
        website_type: "new_website",
        status: "draft",
        readiness_score: 0,
        owner: "",
        notes: [],
      })
      .select("*")
      .single();
    if (insertError) throw insertError;

    await writeAudit({
      action: "intake.link.created",
      entityType: "submission",
      entityId: inserted.id,
      metadata: { token, createdAt: now },
    });

    return mapSubmission(inserted as SubmissionRow, []);
  }

  const answers = await fetchSubmissionAnswers(existing.id);
  return mapSubmission(existing as SubmissionRow, answers);
}

export async function getSubmissionById(submissionId: string) {
  if (!hasSupabaseRepositoryAccess()) {
    return getDemoSubmissionById(submissionId) ?? null;
  }

  const client = db();
  const { data, error } = await client.from("intake_submissions").select("*").eq("id", submissionId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const answers = await fetchSubmissionAnswers(submissionId);
  return mapSubmission(data as SubmissionRow, answers);
}

export async function listSubmissions() {
  if (!hasSupabaseRepositoryAccess()) {
    return listDemoSubmissions();
  }

  const client = db();
  const { data, error } = await client
    .from("intake_submissions")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapSubmission(row as SubmissionRow));
}

export async function getSnapshot(): Promise<StoreSnapshot> {
  if (!hasSupabaseRepositoryAccess()) {
    return getDemoSnapshot();
  }

  const [submissions, documents, notifications, audit] = await Promise.all([
    listSubmissions(),
    listGeneratedDocuments(),
    listNotifications(),
    listAuditLogs(),
  ]);

  return {
    schema: getDemoSnapshot().schema,
    submissions,
    documents,
    notifications,
    audit,
  };
}

export async function saveSubmissionAnswers(
  submissionId: string,
  answers: SubmissionAnswerRecord[],
  fields: Partial<IntakeSubmission>
) {
  if (!hasSupabaseRepositoryAccess()) {
    return saveDemoSubmissionAnswers(submissionId, answers, fields);
  }

  const client = db();
  const { error: upsertError } = await client.from("intake_answers").upsert(
    answers.map((answer) => ({
      submission_id: submissionId,
      question_id: answer.questionId,
      answer_value: answer.value,
      is_visible_at_submission: answer.isVisibleAtSubmission,
      hidden_answer_policy: answer.hiddenAnswerPolicy,
    })),
    { onConflict: "submission_id,question_id" }
  );
  if (upsertError) throw upsertError;

  const { data, error } = await client
    .from("intake_submissions")
    .update({
      client_name: fields.clientName ?? "",
      project_name: fields.projectName ?? "",
      contact_email: fields.contactEmail ?? "",
      website_type: fields.websiteType ?? "new_website",
      readiness_score: fields.readinessScore ?? 0,
      owner: fields.owner ?? "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .select("*")
    .single();
  if (error) throw error;

  await writeAudit({
    action: "intake.progress_saved",
    entityType: "submission",
    entityId: submissionId,
    metadata: { answerCount: answers.length },
  });

  return mapSubmission(data as SubmissionRow, answers);
}

export async function addSubmissionNote(submissionId: string, note: string) {
  if (!hasSupabaseRepositoryAccess()) {
    return addDemoSubmissionNote(submissionId, note);
  }

  const submission = await getSubmissionById(submissionId);
  if (!submission) throw new Error("Submission not found");

  const client = db();
  const nextNotes = [...submission.notes, note];
  const { data, error } = await client
    .from("intake_submissions")
    .update({ notes: nextNotes, updated_at: new Date().toISOString() })
    .eq("id", submissionId)
    .select("*")
    .single();
  if (error) throw error;

  await writeAudit({
    action: "admin.note_added",
    entityType: "submission",
    entityId: submissionId,
    metadata: { note },
  });

  return mapSubmission(data as SubmissionRow, submission.answers);
}

export async function submitSubmission(submissionId: string, readinessScore: number) {
  if (!hasSupabaseRepositoryAccess()) {
    return submitDemoSubmission(submissionId, readinessScore);
  }

  const client = db();
  const submittedAt = new Date().toISOString();
  const { data, error } = await client
    .from("intake_submissions")
    .update({
      status: "submitted",
      readiness_score: readinessScore,
      submitted_at: submittedAt,
      updated_at: submittedAt,
    })
    .eq("id", submissionId)
    .select("*")
    .single();
  if (error) throw error;

  await writeAudit({
    action: "intake.submitted",
    entityType: "submission",
    entityId: submissionId,
    metadata: { readinessScore },
  });

  return mapSubmission(data as SubmissionRow, await fetchSubmissionAnswers(submissionId));
}

export async function createGeneratedDocument(params: {
  submissionId: string;
  documentType: GeneratedDocument["documentType"];
  markdown: string;
  modelName: string;
  estimatedCostUsd: number;
}) {
  if (!hasSupabaseRepositoryAccess()) {
    return createDemoGeneratedDocument(params);
  }

  const client = db();
  const { data, error } = await client
    .from("generated_documents")
    .insert({
      submission_id: params.submissionId,
      document_type: params.documentType,
      status: "ready",
      markdown_content: params.markdown,
      model_name: params.modelName,
      estimated_cost_usd: params.estimatedCostUsd,
    })
    .select("*")
    .single();
  if (error) throw error;

  await writeAudit({
    action: "prd_generation.completed",
    entityType: "document",
    entityId: data.id,
    metadata: { submissionId: params.submissionId, documentType: params.documentType },
  });

  return mapDocument(data as DocumentRow);
}

export async function getDocumentById(documentId: string) {
  if (!hasSupabaseRepositoryAccess()) {
    return getDemoDocumentById(documentId) ?? null;
  }

  const client = db();
  const { data, error } = await client.from("generated_documents").select("*").eq("id", documentId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapDocument(data as DocumentRow);
}

export async function listGeneratedDocuments() {
  if (!hasSupabaseRepositoryAccess()) {
    return getDemoSnapshot().documents;
  }

  const client = db();
  const { data, error } = await client.from("generated_documents").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapDocument(row as DocumentRow));
}

export async function listNotifications() {
  if (!hasSupabaseRepositoryAccess()) {
    return getDemoSnapshot().notifications;
  }

  const client = db();
  const { data, error } = await client.from("notification_logs").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapNotification(row as NotificationRow));
}

export async function listAuditLogs() {
  if (!hasSupabaseRepositoryAccess()) {
    return getDemoSnapshot().audit;
  }

  const client = db();
  const { data, error } = await client.from("audit_logs").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapAudit(row as AuditRow));
}

export async function recordNotification(notification: Omit<NotificationLog, "id" | "createdAt">) {
  if (!hasSupabaseRepositoryAccess()) {
    return recordDemoNotification(notification);
  }

  const client = db();
  const { data, error } = await client
    .from("notification_logs")
    .insert({
      submission_id: notification.submissionId,
      generated_document_id: notification.generatedDocumentId ?? null,
      channel: notification.channel,
      event_type: notification.eventType,
      status: notification.status,
      message: notification.message,
    })
    .select("*")
    .single();
  if (error) throw error;

  await writeAudit({
    action: notification.status === "sent" ? "notification.sent" : "notification.failed",
    entityType: "notification",
    entityId: data.id,
    metadata: { submissionId: notification.submissionId, eventType: notification.eventType },
  });

  return mapNotification(data as NotificationRow);
}

export async function appendAudit(entry: Omit<AuditLogEntry, "id" | "createdAt">) {
  return writeAudit(entry);
}
