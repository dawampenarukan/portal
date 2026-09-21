export const DEFAULT_NPS_QUESTION = "Seberapa mungkin Anda merekomendasikan SPPG?";
export const DEFAULT_RESPONDENT_TARGET = 100;

export const SURVEY_QUESTION_TYPES = [
  "rating",
  "multiple_choice",
  "checkbox",
  "text",
  "nps",
] as const;

export type SurveyQuestionType = (typeof SURVEY_QUESTION_TYPES)[number];

export const SURVEY_CHOICE_TYPES = new Set<string>(["multiple_choice", "checkbox"]);

export type SurveyQuestionInput = {
  /** Stable id — wajib untuk update tanpa menghapus jawaban historis. */
  id?: string;
  question: string;
  type: string;
  options?: string[];
  order: number;
};

export type SurveyAnswerInput = {
  questionId: string;
  value: string;
};

export function isSurveyQuestionType(value: string): value is SurveyQuestionType {
  return (SURVEY_QUESTION_TYPES as readonly string[]).includes(value);
}

export function normalizeRespondentTarget(value: unknown): number {
  const parsed = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_RESPONDENT_TARGET;
  }
  return Math.min(parsed, 100_000);
}

export function normalizeOptionList(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of options) {
    const value = String(raw ?? "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

/** Parse opsi dari editor: satu opsi per baris, atau fallback koma. */
export function parseOptionsFromEditor(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.includes("\n")) {
    return normalizeOptionList(trimmed.split(/\r?\n/));
  }
  return normalizeOptionList(trimmed.split(","));
}

export function optionsToEditorText(options: string[] | null | undefined): string {
  if (!options?.length) return "";
  return options.join("\n");
}

export function ensureNpsQuestion(
  questions: SurveyQuestionInput[],
  npsQuestionText = DEFAULT_NPS_QUESTION
): SurveyQuestionInput[] {
  const withoutNps = questions
    .filter((q) => q.type !== "nps" && q.question.trim())
    .map((q, index) => ({
      ...q,
      question: q.question.trim(),
      options: q.options ? normalizeOptionList(q.options) : undefined,
      order: index,
    }));

  const existingNps = questions.find((q) => q.type === "nps");
  const npsText =
    existingNps?.question.trim() || npsQuestionText.trim() || DEFAULT_NPS_QUESTION;

  return [
    ...withoutNps,
    {
      id: existingNps?.id,
      question: npsText,
      type: "nps",
      order: withoutNps.length,
    },
  ];
}

/** Pecah nilai jawaban: skalar atau JSON array (multi-pilih). */
export function parseAnswerValues(raw: string): string[] {
  const text = raw?.trim() ?? "";
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {
      /* fall through — treat as plain string */
    }
  }
  return [text];
}

export function serializeMultiAnswer(values: string[]): string {
  return JSON.stringify(normalizeOptionList(values));
}

/** Label admin untuk tipe pertanyaan (Fase 2 — sumber kebenaran UI). */
export const SURVEY_QUESTION_TYPE_LABELS: Record<SurveyQuestionType, string> = {
  rating: "Rating (1-5)",
  multiple_choice: "Pilihan tunggal",
  checkbox: "Multi-pilih (boleh lebih dari satu)",
  text: "Teks Bebas",
  nps: "NPS (0-10)",
};

/** Bandingkan set opsi (urutan diabaikan). */
export function optionsSetKey(options: unknown): string {
  return normalizeOptionList(options).slice().sort().join("\u0001");
}

/** True bila ada tambah/hapus pertanyaan, ganti tipe, atau ubah set opsi. */
export function hasStructuralQuestionChanges(
  existing: { id: string; type: string; options: unknown }[],
  incoming: SurveyQuestionInput[]
): boolean {
  const normalized = ensureNpsQuestion(incoming);
  const existingById = new Map(existing.map((q) => [q.id, q]));
  const matchedIds = new Set<string>();

  for (const q of normalized) {
    if (!q.id || !existingById.has(q.id)) {
      return true;
    }
    matchedIds.add(q.id);
    const prev = existingById.get(q.id)!;
    if (prev.type !== q.type) return true;
    if (optionsSetKey(prev.options) !== optionsSetKey(q.options ?? [])) return true;
  }

  return existing.some((q) => !matchedIds.has(q.id));
}

/** Id pertanyaan existing yang tidak ada di payload (akan dihapus saat sync). */
export function missingQuestionIds(
  existing: { id: string }[],
  incoming: SurveyQuestionInput[]
): string[] {
  const normalized = ensureNpsQuestion(incoming);
  const keep = new Set(
    normalized.map((q) => q.id).filter((id): id is string => Boolean(id))
  );
  return existing.filter((q) => !keep.has(q.id)).map((q) => q.id);
}

export function validateSurveyQuestionDraft(
  questions: SurveyQuestionInput[]
): string | null {
  const normalized = ensureNpsQuestion(questions);
  const content = normalized.filter((q) => q.type !== "nps");
  if (content.length === 0) return "Minimal satu pertanyaan selain NPS";

  for (const q of content) {
    if (!isSurveyQuestionType(q.type)) {
      return `Tipe pertanyaan tidak dikenal: ${q.type}`;
    }
    if (SURVEY_CHOICE_TYPES.has(q.type)) {
      const opts = normalizeOptionList(q.options);
      if (opts.length < 2) {
        return `Pertanyaan pilihan membutuhkan minimal 2 opsi: “${q.question}”`;
      }
    }
  }
  return null;
}

type QuestionForValidation = {
  id: string;
  type: string;
  options: unknown;
  question: string;
};

/**
 * Validasi jawaban submit publik.
 * Mengembalikan daftar jawaban yang sudah dinormalisasi, atau pesan error.
 */
export function validateSurveyAnswers(
  questions: QuestionForValidation[],
  answers: SurveyAnswerInput[] | undefined
): { ok: true; answers: SurveyAnswerInput[] } | { ok: false; error: string } {
  if (!answers?.length) {
    return { ok: false, error: "Jawaban wajib diisi" };
  }

  const byQuestion = new Map<string, string>();
  for (const a of answers) {
    if (!a.questionId || typeof a.value !== "string") {
      return { ok: false, error: "Format jawaban tidak valid" };
    }
    if (byQuestion.has(a.questionId)) {
      return { ok: false, error: "Ada pertanyaan yang dijawab lebih dari sekali" };
    }
    byQuestion.set(a.questionId, a.value);
  }

  const normalized: SurveyAnswerInput[] = [];

  for (const q of questions) {
    const raw = byQuestion.get(q.id);
    if (raw === undefined) {
      return { ok: false, error: `Pertanyaan belum dijawab: “${q.question}”` };
    }

    const type = q.type;
    const options = normalizeOptionList(q.options);

    if (type === "rating") {
      const n = parseInt(raw.trim(), 10);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        return { ok: false, error: `Rating harus 1–5: “${q.question}”` };
      }
      normalized.push({ questionId: q.id, value: String(n) });
      continue;
    }

    if (type === "nps") {
      const n = parseInt(raw.trim(), 10);
      if (!Number.isInteger(n) || n < 0 || n > 10) {
        return { ok: false, error: `Skor NPS harus 0–10: “${q.question}”` };
      }
      normalized.push({ questionId: q.id, value: String(n) });
      continue;
    }

    if (type === "text") {
      const text = raw.trim();
      if (!text) {
        return { ok: false, error: `Teks wajib diisi: “${q.question}”` };
      }
      normalized.push({ questionId: q.id, value: text });
      continue;
    }

    if (type === "multiple_choice") {
      if (options.length < 2) {
        return {
          ok: false,
          error: `Opsi pertanyaan belum lengkap: “${q.question}”`,
        };
      }
      const value = raw.trim();
      if (!options.includes(value)) {
        return { ok: false, error: `Pilihan tidak valid: “${q.question}”` };
      }
      normalized.push({ questionId: q.id, value });
      continue;
    }

    if (type === "checkbox") {
      if (options.length < 2) {
        return {
          ok: false,
          error: `Opsi pertanyaan belum lengkap: “${q.question}”`,
        };
      }
      const values = parseAnswerValues(raw);
      if (values.length === 0) {
        return { ok: false, error: `Pilih minimal satu opsi: “${q.question}”` };
      }
      if (values.some((v) => !options.includes(v))) {
        return { ok: false, error: `Pilihan tidak valid: “${q.question}”` };
      }
      normalized.push({
        questionId: q.id,
        value: serializeMultiAnswer(values),
      });
      continue;
    }

    return { ok: false, error: `Tipe pertanyaan tidak didukung: ${type}` };
  }

  if (byQuestion.size !== questions.length) {
    return { ok: false, error: "Ada pertanyaan yang tidak valid untuk survey ini" };
  }

  return { ok: true, answers: normalized };
}
