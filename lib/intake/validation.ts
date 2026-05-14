import { z } from "zod";
import type { IntakeQuestion, IntakeSchema, LogicRule } from "./types";

export const logicRuleSchema: z.ZodType<LogicRule> = z.lazy(() =>
  z.discriminatedUnion("op", [
    z.object({ op: z.literal("equals"), field: z.string(), value: z.unknown() }),
    z.object({ op: z.literal("not_equals"), field: z.string(), value: z.unknown() }),
    z.object({ op: z.literal("includes"), field: z.string(), value: z.unknown() }),
    z.object({ op: z.literal("exists"), field: z.string() }),
    z.object({ op: z.literal("and"), rules: z.array(logicRuleSchema).min(1) }),
    z.object({ op: z.literal("or"), rules: z.array(logicRuleSchema).min(1) }),
    z.object({ op: z.literal("not"), rule: logicRuleSchema }),
    z.object({ op: z.literal("gt"), field: z.string(), value: z.number() }),
    z.object({ op: z.literal("lt"), field: z.string(), value: z.number() }),
  ])
);

const hiddenAnswerPolicySchema = z.enum(["clear_when_hidden", "retain_when_hidden", "retain_for_audit"]);

const questionSchema: z.ZodType<IntakeQuestion> = z.object({
  id: z.string(),
  sectionId: z.string(),
  label: z.string(),
  helpText: z.string().optional(),
  type: z.enum(["text", "textarea", "email", "phone", "url", "number", "currency", "date", "radio", "checkbox", "select", "file", "rating"]),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  required: z.boolean().optional(),
  requiredWhen: logicRuleSchema.optional(),
  visibleWhen: logicRuleSchema.optional(),
  hiddenAnswerPolicy: hiddenAnswerPolicySchema.optional(),
  prdMapping: z.array(z.string()),
  riskCategory: z.string().optional(),
  placeholder: z.string().optional(),
  validation: z.object({
    minLength: z.number().int().nonnegative().optional(),
    maxLength: z.number().int().positive().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    allowedFileTypes: z.array(z.string()).optional(),
    maxFileSizeBytes: z.number().int().positive().optional(),
  }).optional(),
});

const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  order: z.number().int(),
  alwaysShown: z.boolean().optional(),
  visibleWhen: logicRuleSchema.optional(),
});

export const intakeSchemaSchema: z.ZodType<IntakeSchema> = z.object({
  schemaId: z.string(),
  version: z.string(),
  status: z.enum(["draft", "active", "retired"]),
  sections: z.array(sectionSchema),
  questions: z.array(questionSchema),
});

export const saveProgressSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
});

export const submitSchema = z.object({
  submissionId: z.string(),
});

export const adminReviewSchema = z.object({
  action: z.enum(["regenerate", "approve", "approve_with_assumptions", "needs_follow_up"]),
  note: z.string().optional(),
});

export const signedUploadSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
  size: z.number().int().positive(),
});

export const notificationTestSchema = z.object({
  recipient: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
});
