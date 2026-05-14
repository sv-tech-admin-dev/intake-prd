import type { IntakeQuestion, IntakeSchema, JsonValue, LogicRule } from "./types";

function isEmptyValue(value: unknown) {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

function includesValue(source: unknown, expected: unknown) {
  if (Array.isArray(source)) {
    return source.includes(expected as never);
  }
  if (typeof source === "string") {
    return source.includes(String(expected));
  }
  return false;
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function evaluateLogicRule(
  rule: LogicRule | undefined,
  answers: Record<string, JsonValue | undefined>,
  depth = 0
): boolean {
  if (!rule) return true;
  if (depth > 10) return false;

  switch (rule.op) {
    case "equals":
      return answers[rule.field] === rule.value;
    case "not_equals":
      return !isEmptyValue(answers[rule.field]) && answers[rule.field] !== rule.value;
    case "includes":
      return includesValue(answers[rule.field], rule.value);
    case "exists":
      return !isEmptyValue(answers[rule.field]);
    case "and":
      return rule.rules.every((child) => evaluateLogicRule(child, answers, depth + 1));
    case "or":
      return rule.rules.some((child) => evaluateLogicRule(child, answers, depth + 1));
    case "not":
      return !evaluateLogicRule(rule.rule, answers, depth + 1);
    case "gt": {
      const value = toNumber(answers[rule.field]);
      return value !== null && value > rule.value;
    }
    case "lt": {
      const value = toNumber(answers[rule.field]);
      return value !== null && value < rule.value;
    }
    default:
      return false;
  }
}

export function isQuestionVisible(question: IntakeQuestion, answers: Record<string, JsonValue | undefined>) {
  return evaluateLogicRule(question.visibleWhen, answers);
}

export function isSectionVisible(schema: IntakeSchema, sectionId: string, answers: Record<string, JsonValue | undefined>) {
  const section = schema.sections.find((item) => item.id === sectionId);
  if (!section) return false;
  if (section.alwaysShown) return true;
  return evaluateLogicRule(section.visibleWhen, answers);
}

export function getVisibleQuestions(schema: IntakeSchema, answers: Record<string, JsonValue | undefined>) {
  return schema.questions.filter((question) => isQuestionVisible(question, answers));
}

export function getVisibleSections(schema: IntakeSchema, answers: Record<string, JsonValue | undefined>) {
  const visibleQuestionIds = new Set(getVisibleQuestions(schema, answers).map((question) => question.id));
  return schema.sections
    .filter((section) => section.alwaysShown || evaluateLogicRule(section.visibleWhen, answers))
    .map((section) => ({
      ...section,
      questions: schema.questions.filter((question) => question.sectionId === section.id && visibleQuestionIds.has(question.id)),
    }))
    .filter((section) => section.questions.length > 0 || section.alwaysShown);
}

export function normalizeAnswers(answers: Record<string, JsonValue | undefined>) {
  return Object.fromEntries(Object.entries(answers).filter(([, value]) => !isEmptyValue(value)));
}
