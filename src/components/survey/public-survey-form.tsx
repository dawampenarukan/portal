"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  choiceOptionsOnly,
  choiceSelectableCount,
  formatOtherAnswer,
  hasOtherOption,
  isOtherAnswerValue,
  isSurveyQuestionType,
  parseOtherAnswerText,
  serializeMultiAnswer,
  SURVEY_CHOICE_TYPES,
  SURVEY_OTHER_LABEL,
  SURVEY_OTHER_OPTION,
} from "@/lib/survey-defaults";
import type { SurveyView } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PublicSurveyFormProps {
  survey: SurveyView;
}

type AnswerState = Record<string, string | string[]>;

function withoutOtherValues(list: string[]): string[] {
  return list.filter((v) => !isOtherAnswerValue(v));
}

function findOtherValue(list: string[]): string | undefined {
  return list.find((v) => isOtherAnswerValue(v));
}

export function PublicSurveyForm({ survey }: PublicSurveyFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [school, setSchool] = useState("");
  const [answers, setAnswers] = useState<AnswerState>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const questions = useMemo(
    () => [...survey.questions].sort((a, b) => a.order - b.order),
    [survey.questions]
  );

  /** Selaras admin: pilihan butuh minimal 2 opsi (Lainnya dihitung). */
  const hasBrokenChoice = questions.some(
    (q) => SURVEY_CHOICE_TYPES.has(q.type) && choiceSelectableCount(q.options) < 2
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

  function setOtherText(questionId: string, text: string) {
    setOtherTexts((prev) => ({ ...prev, [questionId]: text }));
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

  function selectOtherMultipleChoice(questionId: string) {
    const text = (otherTexts[questionId] ?? "").trim();
    setScalarAnswer(questionId, text ? formatOtherAnswer(text) : SURVEY_OTHER_OPTION);
  }

  function updateOtherMultipleChoiceText(questionId: string, text: string) {
    setOtherText(questionId, text);
    const current = answers[questionId];
    if (typeof current === "string" && isOtherAnswerValue(current)) {
      setScalarAnswer(questionId, text.trim() ? formatOtherAnswer(text) : SURVEY_OTHER_OPTION);
    }
  }

  function toggleOtherCheckbox(questionId: string) {
    setAnswers((prev) => {
      const current = prev[questionId];
      const list = Array.isArray(current) ? [...current] : [];
      const existing = findOtherValue(list);
      if (existing) {
        return { ...prev, [questionId]: withoutOtherValues(list) };
      }
      const text = (otherTexts[questionId] ?? "").trim();
      return {
        ...prev,
        [questionId]: [
          ...withoutOtherValues(list),
          text ? formatOtherAnswer(text) : SURVEY_OTHER_OPTION,
        ],
      };
    });
    clearFieldError(questionId);
  }

  function updateOtherCheckboxText(questionId: string, text: string) {
    setOtherText(questionId, text);
    setAnswers((prev) => {
      const current = prev[questionId];
      if (!Array.isArray(current) || !findOtherValue(current)) return prev;
      return {
        ...prev,
        [questionId]: [
          ...withoutOtherValues(current),
          text.trim() ? formatOtherAnswer(text) : SURVEY_OTHER_OPTION,
        ],
      };
    });
  }

  function resolveAnswerForSubmit(questionId: string, type: string): string {
    const value = answers[questionId];
    if (type === "checkbox" && Array.isArray(value)) {
      const text = (otherTexts[questionId] ?? "").trim();
      const resolved = value.map((v) => {
        if (!isOtherAnswerValue(v)) return v;
        return text ? formatOtherAnswer(text) : v;
      });
      return serializeMultiAnswer(resolved);
    }
    if (typeof value === "string" && isOtherAnswerValue(value)) {
      const text = (otherTexts[questionId] ?? "").trim() || parseOtherAnswerText(value);
      return text ? formatOtherAnswer(text) : value;
    }
    return String(value ?? "").trim();
  }

  function validateClient(): string | null {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.respondentName = "Nama wajib diisi";
    const ageNumber = Number(age);
    if (!age.trim() || !Number.isInteger(ageNumber) || ageNumber < 1 || ageNumber > 120) {
      nextErrors.respondentAge = "Umur wajib diisi (1–120)";
    }
    if (!school.trim()) nextErrors.respondentSchool = "Nama sekolah/posyandu wajib diisi";

    for (const q of questions) {
      if (!isSurveyQuestionType(q.type)) {
        nextErrors[q.id] = "Tipe pertanyaan tidak didukung";
        continue;
      }
      const value = answers[q.id];
      const allowOther = hasOtherOption(q.options);

      if (q.type === "checkbox") {
        if (choiceSelectableCount(q.options) < 2) {
          nextErrors[q.id] = "Opsi belum lengkap — hubungi admin";
        } else if (!Array.isArray(value) || value.length === 0) {
          nextErrors[q.id] = "Pilih minimal satu opsi";
        } else if (allowOther && findOtherValue(value)) {
          const otherText =
            (otherTexts[q.id] ?? "").trim() ||
            parseOtherAnswerText(findOtherValue(value) ?? "");
          if (!otherText) nextErrors[q.id] = "Isi teks Lainnya";
        }
        continue;
      }
      if (q.type === "multiple_choice") {
        if (choiceSelectableCount(q.options) < 2) {
          nextErrors[q.id] = "Opsi belum lengkap — hubungi admin";
        } else if (typeof value !== "string" || !value) {
          nextErrors[q.id] = "Pilih salah satu opsi";
        } else if (allowOther && isOtherAnswerValue(value)) {
          const otherText =
            (otherTexts[q.id] ?? "").trim() || parseOtherAnswerText(value);
          if (!otherText) nextErrors[q.id] = "Isi teks Lainnya";
        }
        continue;
      }
      if (typeof value !== "string" || !value.trim()) {
        nextErrors[q.id] = "Wajib dijawab";
      }
    }
    setFieldErrors(nextErrors);
    const first = Object.keys(nextErrors)[0] ?? null;
    return first;
  }

  function scrollToQuestion(questionId: string) {
    const selector =
      questionId.startsWith("respondent")
        ? "#respondent-profile"
        : `[data-question-id="${CSS.escape(questionId)}"]`;
    const el = formRef.current?.querySelector(selector);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const firstErrorId = validateClient();
    if (firstErrorId) {
      setError("Lengkapi data responden dan semua pertanyaan sebelum mengirim.");
      scrollToQuestion(firstErrorId);
      return;
    }

    setSubmitting(true);

    const payloadAnswers = questions.map((q) => ({
      questionId: q.id,
      value: resolveAnswerForSubmit(q.id, q.type),
    }));

    try {
      const res = await fetch(`/api/surveys/${survey.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respondentName: name.trim(),
          respondentAge: Number(age),
          respondentSchool: school.trim(),
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

      <fieldset id="respondent-profile" className="space-y-4 rounded-lg border p-4">
        <legend className="px-1 font-medium">Data responden</legend>
        <div>
          <label htmlFor="respondent-name" className="mb-1.5 block text-sm font-medium">
            Nama
            <span className="ml-1 text-destructive" aria-hidden>
              *
            </span>
          </label>
          <Input
            id="respondent-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama Anda"
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.respondentName)}
            required
          />
          {fieldErrors.respondentName ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {fieldErrors.respondentName}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="respondent-age" className="mb-1.5 block text-sm font-medium">
            Umur
            <span className="ml-1 text-destructive" aria-hidden>
              *
            </span>
          </label>
          <Input
            id="respondent-age"
            type="number"
            inputMode="numeric"
            min={1}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Umur (tahun)"
            aria-invalid={Boolean(fieldErrors.respondentAge)}
            required
          />
          {fieldErrors.respondentAge ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {fieldErrors.respondentAge}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="respondent-school" className="mb-1.5 block text-sm font-medium">
            Nama Sekolah/Posyandu
            <span className="ml-1 text-destructive" aria-hidden>
              *
            </span>
          </label>
          <Input
            id="respondent-school"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="Nama sekolah atau posyandu"
            aria-invalid={Boolean(fieldErrors.respondentSchool)}
            required
          />
          {fieldErrors.respondentSchool ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {fieldErrors.respondentSchool}
            </p>
          ) : null}
        </div>
      </fieldset>

      {questions.map((q, i) => {
        const fixedOptions = choiceOptionsOnly(q.options);
        const allowOther = hasOtherOption(q.options);
        const otherSelected =
          q.type === "multiple_choice"
            ? typeof answers[q.id] === "string" && isOtherAnswerValue(answers[q.id] as string)
            : Array.isArray(answers[q.id]) && Boolean(findOtherValue(answers[q.id] as string[]));

        return (
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
                  {choiceSelectableCount(q.options) < 2 ? (
                    <p className="text-sm text-destructive">
                      Opsi belum lengkap (minimal 2). Hubungi admin.
                    </p>
                  ) : (
                    <>
                      {fixedOptions.map((opt) => {
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
                      })}
                      {allowOther ? (
                        <div
                          className={cn(
                            "flex min-h-11 flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                            otherSelected && "border-primary bg-primary/5"
                          )}
                        >
                          <label className="flex cursor-pointer items-center gap-3">
                            <input
                              type="radio"
                              name={q.id}
                              checked={otherSelected}
                              onChange={() => selectOtherMultipleChoice(q.id)}
                              className="h-4 w-4 shrink-0"
                            />
                            <span className="shrink-0">{SURVEY_OTHER_LABEL}:</span>
                          </label>
                          <Input
                            value={otherTexts[q.id] ?? ""}
                            onChange={(e) => updateOtherMultipleChoiceText(q.id, e.target.value)}
                            onFocus={() => {
                              if (!otherSelected) selectOtherMultipleChoice(q.id);
                            }}
                            placeholder="Tulis jawaban Anda"
                            className="h-9 min-w-40 flex-1 border-0 border-b border-input bg-transparent px-0 shadow-none focus-visible:ring-0"
                            aria-label={`Teks ${SURVEY_OTHER_LABEL} untuk: ${q.question}`}
                          />
                        </div>
                      ) : null}
                    </>
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
                  {choiceSelectableCount(q.options) < 2 ? (
                    <p className="text-sm text-destructive">
                      Opsi belum lengkap (minimal 2). Hubungi admin.
                    </p>
                  ) : (
                    <>
                      {fixedOptions.map((opt) => {
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
                      })}
                      {allowOther ? (
                        <div
                          className={cn(
                            "flex min-h-11 flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                            otherSelected && "border-primary bg-primary/5"
                          )}
                        >
                          <label className="flex cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              checked={otherSelected}
                              onChange={() => toggleOtherCheckbox(q.id)}
                              className="h-4 w-4 shrink-0 rounded border"
                            />
                            <span className="shrink-0">{SURVEY_OTHER_LABEL}:</span>
                          </label>
                          <Input
                            value={otherTexts[q.id] ?? ""}
                            onChange={(e) => updateOtherCheckboxText(q.id, e.target.value)}
                            onFocus={() => {
                              if (!otherSelected) toggleOtherCheckbox(q.id);
                            }}
                            placeholder="Tulis jawaban Anda"
                            className="h-9 min-w-40 flex-1 border-0 border-b border-input bg-transparent px-0 shadow-none focus-visible:ring-0"
                            aria-label={`Teks ${SURVEY_OTHER_LABEL} untuk: ${q.question}`}
                          />
                        </div>
                      ) : null}
                    </>
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
        );
      })}

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
