import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/lib/env";
import type { IntakeSubmission } from "./types";
import { intakeSchema } from "./schema";
import { calculateReadiness, buildAnswerMap } from "./readiness";
import { getVisibleQuestions } from "./logic";

export type GenerationContext = {
  submission: IntakeSubmission;
  readinessScore: ReturnType<typeof calculateReadiness>;
  answerMap: Record<string, unknown>;
  visibleQuestionLabels: string[];
};

export type GenerationResult = {
  markdown: string;
  modelName: string;
  estimatedCostUsd: number;
  generationMode: "openai" | "fallback";
};

const generationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    executiveSummary: { type: "string" },
    scope: { type: "array", items: { type: "string" } },
    assumptions: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    openQuestions: { type: "array", items: { type: "string" } },
    recommendedNextSteps: { type: "array", items: { type: "string" } },
  },
  required: ["title", "executiveSummary", "scope", "assumptions", "risks", "openQuestions", "recommendedNextSteps"],
} as const;

const generatedPrdSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  scope: z.array(z.string()),
  assumptions: z.array(z.string()),
  risks: z.array(z.string()),
  openQuestions: z.array(z.string()),
  recommendedNextSteps: z.array(z.string()),
});

export function buildGenerationContext(submission: IntakeSubmission): GenerationContext {
  const readinessScore = calculateReadiness(intakeSchema, submission.answers);
  const answerMap = buildAnswerMap(submission.answers);
  const visibleQuestions = getVisibleQuestions(intakeSchema, answerMap);

  return {
    submission,
    readinessScore,
    answerMap,
    visibleQuestionLabels: visibleQuestions.map((question) => question.label),
  };
}

export async function generatePrdMarkdown(context: GenerationContext): Promise<GenerationResult> {
  if (!env.openaiApiKey) {
    return generateFallbackMarkdown(context);
  }

  const client = new OpenAI({ apiKey: env.openaiApiKey });
  const response = await client.responses.create({
    model: env.openaiModel,
    instructions:
      "You generate a PRD for a website intake. Return concise, implementation-ready content that reflects the intake data and readiness score.",
    input: buildPrompt(context),
    text: {
      format: {
        type: "json_schema",
        name: "prd_generation",
        strict: true,
        schema: generationSchema,
      },
    },
  });

  const parsed = generatedPrdSchema.safeParse(JSON.parse(response.output_text));
  if (!parsed.success) {
    return generateFallbackMarkdown(context);
  }

  return {
    markdown: toMarkdown(parsed.data),
    modelName: env.openaiModel,
    estimatedCostUsd: 0.42,
    generationMode: "openai",
  };
}

export function generateFallbackMarkdown(context: GenerationContext): GenerationResult {
  const { submission, readinessScore, answerMap, visibleQuestionLabels } = context;

  const markdown = [
    "# Website Blueprint PRD",
    "",
    "## Executive Summary",
    `- Client: ${submission.clientName || "Unspecified"}`,
    `- Project: ${submission.projectName || "Untitled project"}`,
    `- Readiness score: ${readinessScore.score}`,
    `- Outcome: ${readinessScore.outcome}`,
    "",
    "## Scope",
    ...visibleQuestionLabels.slice(0, 8).map((label) => `- ${label}`),
    "",
    "## Assumptions",
    "- Human review is required before client handoff.",
    "- This draft follows the current intake data only.",
    "",
    "## Risks",
    ...(readinessScore.riskFlags.length > 0 ? readinessScore.riskFlags.map((item) => `- ${item}`) : ["- No additional risk flags"]),
    "",
    "## Open Questions",
    ...(readinessScore.followUpQuestions.length > 0
      ? readinessScore.followUpQuestions.map((item) => `- ${item}`)
      : ["- None"]),
    "",
    "## Recommended Next Steps",
    "- Review the missing fields with the client.",
    "- Confirm scope assumptions and launch date.",
    "- Finalize PRD and handoff the implementation plan.",
    "",
    "## Key Inputs",
    ...Object.entries(answerMap).slice(0, 12).map(([key, value]) => `- ${key}: ${formatValue(value)}`),
  ].join("\n");

  return {
    markdown,
    modelName: "fallback-prd-generator",
    estimatedCostUsd: 0,
    generationMode: "fallback",
  };
}

export function toMarkdown(prd: z.infer<typeof generatedPrdSchema>) {
  return [
    `# ${prd.title}`,
    "",
    "## Executive Summary",
    prd.executiveSummary,
    "",
    "## Scope",
    ...prd.scope.map((item) => `- ${item}`),
    "",
    "## Assumptions",
    ...prd.assumptions.map((item) => `- ${item}`),
    "",
    "## Risks",
    ...prd.risks.map((item) => `- ${item}`),
    "",
    "## Open Questions",
    ...prd.openQuestions.map((item) => `- ${item}`),
    "",
    "## Recommended Next Steps",
    ...prd.recommendedNextSteps.map((item) => `- ${item}`),
    "",
    "## Review Notes",
    "- Human review required before client handoff.",
  ].join("\n");
}

function buildPrompt(context: GenerationContext) {
  const { submission, readinessScore, answerMap, visibleQuestionLabels } = context;

  return [
    "Create a PRD for the website project using the intake data below.",
    "Return only structured JSON matching the schema.",
    "",
    `Client name: ${submission.clientName || "Unspecified"}`,
    `Project name: ${submission.projectName || "Untitled project"}`,
    `Contact email: ${submission.contactEmail || "Unspecified"}`,
    `Website type: ${submission.websiteType}`,
    `Readiness score: ${readinessScore.score}`,
    `Readiness outcome: ${readinessScore.outcome}`,
    "",
    "Visible questions:",
    ...visibleQuestionLabels.map((label) => `- ${label}`),
    "",
    "Answers:",
    ...Object.entries(answerMap).map(([key, value]) => `- ${key}: ${formatValue(value)}`),
    "",
    "Missing fields:",
    ...(readinessScore.missingFields.length > 0
      ? readinessScore.missingFields.map((item) => `- ${item.label} (${item.severity})`)
      : ["- None"]),
    "",
    "Risk flags:",
    ...(readinessScore.riskFlags.length > 0 ? readinessScore.riskFlags.map((item) => `- ${item}`) : ["- None"]),
    "",
    "Follow-up questions:",
    ...(readinessScore.followUpQuestions.length > 0
      ? readinessScore.followUpQuestions.map((item) => `- ${item}`)
      : ["- None"]),
    "",
    "Write concise, implementation-ready content. Preserve the intake facts. Do not add invented features.",
  ].join("\n");
}

function formatValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "Not provided";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
