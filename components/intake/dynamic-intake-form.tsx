"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getVisibleQuestions, getVisibleSections } from "@/lib/intake/logic";
import type { IntakeSchema, JsonValue, IntakeSubmission } from "@/lib/intake/types";

type Props = {
  token: string;
  schema: IntakeSchema;
  submission: IntakeSubmission;
};

function valueAsString(value: JsonValue | undefined) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function DynamicIntakeForm({ token, schema, submission }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<Record<string, JsonValue>>(() =>
    Object.fromEntries(submission.answers.map((item) => [item.questionId, item.value]))
  );
  const [activeSection, setActiveSection] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const visibleSections = getVisibleSections(schema, answers);
  const visibleQuestions = getVisibleQuestions(schema, answers);
  const stepCount = visibleSections.length + 1;
  const safeActiveStep = Math.min(activeSection, Math.max(stepCount - 1, 0));
  const currentSection = visibleSections[safeActiveStep];
  const answeredQuestions = visibleQuestions.filter((question) => {
    const value = answers[question.id];
    return value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0);
  }).length;
  const progressPercent = visibleQuestions.length > 0 ? Math.round((answeredQuestions / visibleQuestions.length) * 100) : 0;
  const isReviewStep = safeActiveStep === stepCount - 1;
  const currentStepLabel = isReviewStep ? "Review" : currentSection?.title ?? "Step";

  function updateAnswer(questionId: string, value: JsonValue) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  async function saveProgress() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/intake/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!response.ok) {
        throw new Error("Unable to save progress");
      }
      setMessage("Progress saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save progress");
    } finally {
      setSaving(false);
    }
  }

  async function submit() {
    setSaving(true);
    setError(null);
    setMessage(null);
    setMessage("Submitting intake and generating the PRD...");
    try {
      const saveResponse = await fetch(`/api/intake/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!saveResponse.ok) throw new Error("Unable to save final answers");

      const response = await fetch(`/api/intake/submissions/${submission.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id }),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      setMessage("Submission received. Redirecting...");
      router.push(`/intake/${token}/submitted`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Submission failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="gap-0">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardDescription className="text-xs uppercase tracking-[0.24em]">Progress {progressPercent}%</CardDescription>
            <CardTitle className="font-heading mt-1 text-2xl">{submission.projectName || "Website intake"}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Step {safeActiveStep + 1} of {stepCount}: {currentStepLabel}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveProgress} disabled={saving}>
              Save progress
            </Button>
            <Button onClick={isReviewStep ? submit : () => setActiveSection((value) => Math.min(stepCount - 1, value + 1))} disabled={saving}>
              {isReviewStep ? "Submit intake" : "Next step"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-all"
            style={{ width: `${stepCount > 0 ? Math.round(((safeActiveStep + 1) / stepCount) * 100) : 0}%` }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleSections.map((section, index) => {
            const isActive = index === safeActiveStep;
            const isCompleted = index < safeActiveStep;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(index)}
                className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCompleted
                      ? "border-border bg-muted text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/20"
                }`}
              >
                {section.title}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setActiveSection(stepCount - 1)}
            className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
              isReviewStep ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-foreground/20"
            }`}
          >
            Review
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
          <p className="font-heading font-medium text-foreground">{currentStepLabel}</p>
          <p className="mt-1">
            {isReviewStep
              ? "Review the intake before submitting it to the team."
              : currentSection?.description ?? "Conditional logic hid all sections for the current answers."}
          </p>
        </div>

        {!isReviewStep && currentSection ? (
          <div className="grid gap-5">
            {currentSection.questions.map((question) => (
              <Field key={question.id} question={question} value={answers[question.id]} onChange={updateAnswer} />
            ))}
          </div>
        ) : null}

        {isReviewStep ? (
          <ReviewPanel schema={schema} answers={answers} />
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setActiveSection((value) => Math.max(0, value - 1))}
            disabled={safeActiveStep === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveSection((value) => Math.min(stepCount - 1, value + 1))}
            disabled={isReviewStep}
          >
            {isReviewStep ? "Last step" : "Next"}
          </Button>
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  question,
  value,
  onChange,
}: {
  question: IntakeSchema["questions"][number];
  value: JsonValue | undefined;
  onChange: (questionId: string, value: JsonValue) => void;
}) {
  const common = "mt-2 w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/40";

  return (
    <label className="block">
      <span className="font-heading text-sm font-medium text-foreground">{question.label}</span>
      {question.helpText ? <span className="mt-1 block text-xs text-muted-foreground">{question.helpText}</span> : null}
      {question.type === "textarea" ? (
        <textarea
          className={`${common} min-h-28 bg-background text-foreground placeholder:text-muted-foreground`}
          placeholder={question.placeholder}
          value={valueAsString(value)}
          onChange={(event) => onChange(question.id, event.target.value)}
        />
      ) : question.type === "radio" || question.type === "select" ? (
        <select
          className={`${common} bg-background text-foreground`}
          value={valueAsString(value)}
          onChange={(event) => onChange(question.id, event.target.value)}
        >
          <option value="">Select an option</option>
          {(question.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={`${common} bg-background text-foreground placeholder:text-muted-foreground`}
          type={question.type === "email" || question.type === "url" || question.type === "date" || question.type === "number" ? question.type : "text"}
          placeholder={question.placeholder}
          value={valueAsString(value)}
          onChange={(event) =>
            onChange(question.id, question.type === "number" ? Number(event.target.value || 0) : event.target.value)
          }
        />
      )}
    </label>
  );
}

function ReviewPanel({ schema, answers }: { schema: IntakeSchema; answers: Record<string, JsonValue> }) {
  const visibleQuestions = getVisibleSections(schema, answers).flatMap((section) => section.questions);
  return (
    <Card className="gap-0">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardDescription className="text-xs uppercase tracking-[0.24em]">Review</CardDescription>
            <CardTitle className="font-heading mt-1 text-lg">What we have so far</CardTitle>
          </div>
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            {visibleQuestions.length} visible questions
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-3 md:grid-cols-2">
          {visibleQuestions.slice(0, 8).map((question) => (
            <div key={question.id} className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{question.label}</p>
              <p className="mt-2 text-sm text-foreground">{valueAsString(answers[question.id]) || "Not answered"}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
