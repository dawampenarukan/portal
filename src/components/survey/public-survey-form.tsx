"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  isSurveyQuestionType,
  serializeMultiAnswer,
  SURVEY_CHOICE_TYPES,
} from "@/lib/survey-defaults";
import type { SurveyView } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PublicSurveyFormProps {
  survey: SurveyView;
}

type AnswerState = Record<string, string | string[]>;

export function PublicSurveyForm({ survey }: PublicSurveyFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<AnswerState>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const questions = useMemo(
    () => [...survey.questions].sort((a, b) => a.order - b.order),
    [survey.questions]
  );

  /** Selaras admin: pilihan butuh minimal 2 opsi. */
  const hasBrokenChoice = questions.some(
    (q) => SURVEY_CHOICE_TYPES.has(q.type) && (q.options?.length ?? 0) < 2
  );

  function clearFieldError(questionId: string) {
    setFieldErrors((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }

  function setScalarAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    clearFieldError(questionId);
  }

  function toggleCheckbox(questionId: string, option: string) {
    setAnswers((prev) => {
      const current = prev[questionId];
      const list = Array.isArray(current) ? [...current] : [];
      const idx = list.indexOf(option);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(option);
      return { ...prev, [questionId]: list };
    });
    clearFieldError(questionId);
  }

  function validateClient(): string | null {
    const nextErrors: Record<string, string> = {};
    for (const q of questions) {
      if (!isSurveyQuestionType(q.type)) {
        nextErrors[q.id] = "Tipe pertanyaan tidak didukung";
        continue;
      }
      const value = answers[q.id];
      if (q.type === "checkbox") {
        if ((q.options?.length ?? 0) < 2) {
          nextErrors[q.id] = "Opsi belum lengkap — hubungi admin";
        } else if (!Array.isArray(value) || value.length === 0) {
          nextErrors[q.id] = "Pilih minimal satu opsi";
        }
        continue;
      }
      if (q.type === "multiple_choice") {
        if ((q.options?.length ?? 0) < 2) {
          nextErrors[q.id] = "Opsi belum lengkap — hubungi admin";
        } else if (typeof value !== "string" || !value) {
          nextErrors[q.id] = "Pilih salah satu opsi";
        }
        continue;
      }
      if (typeof value !== "string" || !value.trim()) {
        nextErrors[q.id] = "Wajib dijawab";
      }
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors)[0] ?? null;
  }

  function scrollToQuestion(questionId: string) {
    const el = formRef.current?.querySelector(`[data-question-id="${CSS.escape(questionId)}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const firstErrorId = validateClient();
    if (firstErrorId) {
      setError("Lengkapi semua pertanyaan sebelum mengirim.");
      scrollToQuestion(firstErrorId);
      return;
    }

    setSubmitting(true);

    const payloadAnswers = questions.map((q) => {
      const value = answers[q.id];
      if (q.type === "checkbox" && Array.isArray(value)) {
        return { questionId: q.id, value: serializeMultiAnswer(value) };
      }
      return { questionId: q.id, value: String(value ?? "").trim() };
    });

    try {
      const res = await fetch(`/api/surveys/${survey.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respondentName: name,
          answers: payloadAnswers,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Gagal mengirim");
        return;
      }

      setSubmitted(true);
      router.refresh();
    } catch {
      setError("Gagal mengirim. Periksa koneksi lalu coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="py-12 text-center">
        <h2 className="mt-4 text-2xl font-bold text-primary">Terima Kasih!</h2>
        <p className="mt-2 text-muted-foreground">
          Jawaban survey kamu sudah kami terima.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={(e) => void handleSubmit(e)} className="space-y-6" noValidate>
      {hasBrokenChoice ? (
        <p
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          Beberapa pertanyaan pilihan belum punya minimal 2 opsi. Hubungi admin sebelum mengisi.
        </p>
      ) : null}

      <div>
        <label className="mb-1.5 block text-sm font-medium">Nama (opsional)</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" />
      </div>

      {questions.map((q, i) => (
        <fieldset key={q.id} data-question-id={q.id} className="rounded-lg border p-4">
          <legend className="px-1 font-medium">
            {i + 1}. {q.question}
            <span className="ml-1 text-destructive" aria-hidden>
              *
            </span>
            {q.type === "checkbox" ? (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                (boleh lebih dari satu)
              </span>
            ) : null}
          </legend>
          <div className="mt-3">
            {q.type === "rating" && (
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label={`Rating 1 sampai 5 untuk: ${q.question}`}
                aria-required
              >
                {[1, 2, 3, 4, 5].map((n) => {
                  const selected = answers[q.id] === String(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-pressed={selected}
                      onClick={() => setScalarAnswer(q.id, String(n))}
                      className={cn(
                        "inline-flex h-11 min-w-11 items-center justify-center rounded-full border text-sm font-medium",
                        selected && "bg-primary text-white"
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            )}
            {q.type === "nps" && (
              <div
                className="grid grid-cols-6 gap-2 sm:grid-cols-11"
                role="radiogroup"
                aria-label={`Skor NPS 0 sampai 10 untuk: ${q.question}`}
                aria-required
              >
                {Array.from({ length: 11 }, (_, n) => {
                  const selected = answers[q.id] === String(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-pressed={selected}
                      onClick={() => setScalarAnswer(q.id, String(n))}
                      className={cn(
                        "inline-flex h-11 min-h-11 w-full items-center justify-center rounded-lg border text-sm font-medium",
                        selected && "bg-primary text-white"
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            )}
            {q.type === "multiple_choice" && (
              <div
                className="space-y-2"
                role="radiogroup"
                aria-label={q.question}
                aria-required
              >
                {(q.options?.length ?? 0) < 2 ? (
                  <p className="text-sm text-destructive">
                    Opsi belum lengkap (minimal 2). Hubungi admin.
                  </p>
                ) : (
                  (q.options ?? []).map((opt) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <label
                        key={opt}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                          selected && "border-primary bg-primary/5"
                        )}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={selected}
                          onChange={() => setScalarAnswer(q.id, opt)}
                          className="h-4 w-4 shrink-0"
                        />
                        {opt}
                      </label>
                    );
                  })
                )}
              </div>
            )}
            {q.type === "checkbox" && (
              <div
                className="space-y-2"
                role="group"
                aria-label={q.question}
                aria-required
              >
                {(q.options?.length ?? 0) < 2 ? (
                  <p className="text-sm text-destructive">
                    Opsi belum lengkap (minimal 2). Hubungi admin.
                  </p>
                ) : (
                  (q.options ?? []).map((opt) => {
                    const selected =
                      Array.isArray(answers[q.id]) &&
                      (answers[q.id] as string[]).includes(opt);
                    return (
                      <label
                        key={opt}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                          selected && "border-primary bg-primary/5"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleCheckbox(q.id, opt)}
                          className="h-4 w-4 shrink-0 rounded border"
                        />
                        {opt}
                      </label>
                    );
                  })
                )}
              </div>
            )}
            {q.type === "text" && (
              <Textarea
                rows={3}
                value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                onChange={(e) => setScalarAnswer(q.id, e.target.value)}
                aria-required
                aria-invalid={Boolean(fieldErrors[q.id])}
              />
            )}
            {!isSurveyQuestionType(q.type) ? (
              <p className="text-sm text-destructive">
                Tipe pertanyaan tidak dikenali. Hubungi admin.
              </p>
            ) : null}
            {fieldErrors[q.id] ? (
              <p className="mt-2 text-xs text-destructive" role="alert">
                {fieldErrors[q.id]}
              </p>
            ) : null}
          </div>
        </fieldset>
      ))}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={submitting || hasBrokenChoice}
        className="w-full sm:w-auto"
      >
        {submitting ? "Mengirim..." : "Kirim Jawaban"}
      </Button>
    </form>
  );
}
