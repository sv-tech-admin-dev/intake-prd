export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "url"
  | "number"
  | "currency"
  | "date"
  | "radio"
  | "checkbox"
  | "select"
  | "file"
  | "rating";

export type HiddenAnswerPolicy =
  | "clear_when_hidden"
  | "retain_when_hidden"
  | "retain_for_audit";

export type LogicRule =
  | { op: "equals"; field: string; value: unknown }
  | { op: "not_equals"; field: string; value: unknown }
  | { op: "includes"; field: string; value: unknown }
  | { op: "exists"; field: string }
  | { op: "and"; rules: LogicRule[] }
  | { op: "or"; rules: LogicRule[] }
  | { op: "not"; rule: LogicRule }
  | { op: "gt"; field: string; value: number }
  | { op: "lt"; field: string; value: number };

export type IntakeQuestion = {
  id: string;
  sectionId: string;
  label: string;
  helpText?: string;
  type: FieldType;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  requiredWhen?: LogicRule;
  visibleWhen?: LogicRule;
  hiddenAnswerPolicy?: HiddenAnswerPolicy;
  prdMapping: string[];
  riskCategory?: string;
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    allowedFileTypes?: string[];
    maxFileSizeBytes?: number;
  };
};

export type IntakeSection = {
  id: string;
  title: string;
  description?: string;
  order: number;
  alwaysShown?: boolean;
  visibleWhen?: LogicRule;
};

export type IntakeSchema = {
  schemaId: string;
  version: string;
  status: "draft" | "active" | "retired";
  sections: IntakeSection[];
  questions: IntakeQuestion[];
};

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "scored"
  | "queued_for_generation"
  | "generating"
  | "prd_generated"
  | "prd_with_assumptions"
  | "readiness_report_generated"
  | "needs_follow_up"
  | "generation_failed"
  | "approved"
  | "approved_with_assumptions";

export type DocumentType = "prd" | "prd_with_assumptions" | "readiness_report";

export type DocumentStatus =
  | "queued"
  | "generating"
  | "ready"
  | "failed"
  | "approved";

export type SubmissionAnswerRecord = {
  questionId: string;
  value: JsonValue;
  isVisibleAtSubmission: boolean;
  hiddenAnswerPolicy: HiddenAnswerPolicy;
};

export type GeneratedDocument = {
  id: string;
  submissionId: string;
  documentType: DocumentType;
  status: DocumentStatus;
  markdown: string;
  pdfBuffer: Uint8Array;
  modelName: string;
  estimatedCostUsd: number;
  createdAt: string;
};

export type NotificationLog = {
  id: string;
  submissionId: string;
  generatedDocumentId?: string;
  channel: "email" | "slack" | "teams";
  eventType:
    | "intake_submitted"
    | "prd_generated"
    | "readiness_report_generated"
    | "prd_generation_failed"
    | "prd_approved";
  status: "queued" | "sent" | "failed";
  message: string;
  createdAt: string;
};

export type AuditLogEntry = {
  id: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type SubmissionReadiness = {
  score: number;
  outcome: "prd" | "prd_with_assumptions" | "readiness_report" | "not_ready";
  missingFields: Array<{ questionId: string; label: string; severity: "critical" | "warning" }>;
  criticalBlockers: string[];
  followUpQuestions: string[];
  riskFlags: string[];
};

export type IntakeSubmission = {
  id: string;
  token: string;
  schemaVersion: string;
  clientName: string;
  projectName: string;
  contactEmail: string;
  websiteType: "new_website" | "redesign" | "migration";
  status: SubmissionStatus;
  readinessScore: number;
  owner: string;
  notes: string[];
  answers: SubmissionAnswerRecord[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
};

export type StoreSnapshot = {
  schema: IntakeSchema;
  submissions: IntakeSubmission[];
  documents: GeneratedDocument[];
  notifications: NotificationLog[];
  audit: AuditLogEntry[];
};
