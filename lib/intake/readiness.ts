import type { IntakeSchema, JsonValue, SubmissionAnswerRecord, SubmissionReadiness } from "./types";
import { getVisibleQuestions, isQuestionVisible } from "./logic";

function answerById(answers: SubmissionAnswerRecord[]) {
  return Object.fromEntries(answers.map((answer) => [answer.questionId, answer.value]));
}

export function buildAnswerMap(answers: SubmissionAnswerRecord[]) {
  return answerById(answers) as Record<string, JsonValue>;
}

export function calculateReadiness(schema: IntakeSchema, answers: SubmissionAnswerRecord[]): SubmissionReadiness {
  const answerMap = buildAnswerMap(answers);
  const visibleQuestions = getVisibleQuestions(schema, answerMap);
  const missingFields: SubmissionReadiness["missingFields"] = [];
  const riskFlags = new Set<string>();
  const criticalBlockers: string[] = [];
  const followUpQuestions: string[] = [];

  for (const question of visibleQuestions) {
    const value = answerMap[question.id];
    const required = Boolean(question.required) || isQuestionVisible({ ...question, visibleWhen: question.requiredWhen }, answerMap);
    const missing = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

    if (required && missing) {
      const severity = question.riskCategory ? "critical" : "warning";
      missingFields.push({ questionId: question.id, label: question.label, severity });
      if (severity === "critical") {
        criticalBlockers.push(question.label);
      }
      continue;
    }

    if (question.riskCategory) {
      riskFlags.add(question.riskCategory);
    }
  }

  const requiredCount = visibleQuestions.filter((question) => question.required || question.requiredWhen).length || 1;
  const missingCount = missingFields.length;
  const score = Math.max(0, Math.min(100, Math.round(100 - (missingCount / requiredCount) * 55 - criticalBlockers.length * 8)));

  let outcome: SubmissionReadiness["outcome"] = "not_ready";
  if (criticalBlockers.length > 0 || score < 50) {
    outcome = "not_ready";
  } else if (score >= 85) {
    outcome = "prd";
  } else if (score >= 70) {
    outcome = "prd_with_assumptions";
  } else {
    outcome = "readiness_report";
  }

  if (outcome === "prd") {
    followUpQuestions.push("Confirm the build scope with the reviewer before handoff.");
  } else if (outcome === "prd_with_assumptions") {
    followUpQuestions.push("Review assumptions around scope, content and integrations.");
  } else if (outcome === "readiness_report") {
    followUpQuestions.push("Resolve critical blockers before generating a client-ready PRD.");
  } else {
    followUpQuestions.push("Capture missing critical intake details first.");
  }

  return {
    score,
    outcome,
    missingFields,
    criticalBlockers,
    followUpQuestions,
    riskFlags: Array.from(riskFlags),
  };
}
