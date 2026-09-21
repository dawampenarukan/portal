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

/** Sentinel di array options — tidak ditampilkan mentah ke responden. */
export const SURVEY_OTHER_OPTION = "__OTHER__";
export const SURVEY_OTHER_LABEL = "Lainnya";
export const SURVEY_OTHER_PREFIX = "Lainnya: ";

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
  return choiceOptionsOnly(options).join("\n");
}

/** Opsi sentinel / placeholder "Lainnya" → dianggap opsi isian bebas (bukan pilihan tetap). */
export function isOtherSentinel(option: string): boolean {
  const t = option.trim();
  if (!t) return false;
  if (t === SURVEY_OTHER_OPTION) return true;
  // Exact "Lainnya" / "Lainnya..." / "Lainnya…"
  if (/^lainnya(\.{2,}|\u2026)?$/i.test(t)) return true;
  // "Lainnya:" / "Lainnya: ____" (blank underline placeholder)
  if (/^lainnya\s*:\s*[_\s.\-–—]*$/i.test(t)) return true;
  return false;
}

export function choiceOptionsOnly(options: unknown): string[] {
  return normalizeOptionList(options).filter((o) => !isOtherSentinel(o));
}

export function hasOtherOption(options: unknown): boolean {
  return normalizeOptionList(options).some(isOtherSentinel);
}

export function composeChoiceOptions(fixed: string[], allowOther: boolean): string[] {
  const base = choiceOptionsOnly(fixed);
  return allowOther ? [...base, SURVEY_OTHER_OPTION] : base;
}

/** Normalisasi opsi pilihan ke bentuk kanonik: opsi tetap + `__OTHER__` jika ada Lainnya. */
export function canonicalizeChoiceOptions(options: unknown): string[] {
  return composeChoiceOptions(choiceOptionsOnly(options), hasOtherOption(options));
}

export function choiceSelectableCount(options: unknown): number {
  return canonicalizeChoiceOptions(options).length;
}

export function formatOtherAnswer(text: string): string {
  return `${SURVEY_OTHER_PREFIX}${text.trim()}`;
}

export function isOtherAnswerValue(value: string): boolean {
  const t = value.trim();
  if (!t) return false;
  if (t === SURVEY_OTHER_OPTION) return true;
  return /^lainnya\s*:/i.test(t);
}

export function parseOtherAnswerText(value: string): string {
  const t = value.trim();
  if (t === SURVEY_OTHER_OPTION) return "";
  const match = t.match(/^lainnya\s*:\s*(.*)$/i);
  return match ? (match[1] ?? "").trim() : "";
}

export function isValidChoiceValue(value: string, options: unknown): boolean {
  const fixed = choiceOptionsOnly(options);
  if (fixed.includes(value)) return true;
  if (!hasOtherOption(options)) return false;
  return isOtherAnswerValue(value) && parseOtherAnswerText(value).length > 0;
}

/** Label bucket agregasi (gabungkan semua isian Lainnya). */
export function choiceAnswerBucketLabel(value: string): string {
  return isOtherAnswerValue(value) ? SURVEY_OTHER_LABEL : value;
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
      options: SURVEY_CHOICE_TYPES.has(q.type)
        ? canonicalizeChoiceOptions(q.options)
        : undefined,
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

/** Bandingkan set opsi (urutan diabaikan; Lainnya dikanonikkan ke `__OTHER__`). */
export function optionsSetKey(options: unknown): string {
  return canonicalizeChoiceOptions(options).slice().sort().join("\u0001");
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
      if (choiceSelectableCount(q.options) < 2) {
        return `Pertanyaan pilihan membutuhkan minimal 2 opsi (termasuk Lainnya jika diaktifkan): “${q.question}”`;
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
      if (choiceSelectableCount(options) < 2) {
        return {
          ok: false,
          error: `Opsi pertanyaan belum lengkap: “${q.question}”`,
        };
      }
      const value = raw.trim();
      if (!isValidChoiceValue(value, options)) {
        if (isOtherAnswerValue(value) && !parseOtherAnswerText(value)) {
          return {
            ok: false,
            error: `Isi teks Lainnya: “${q.question}”`,
          };
        }
        return { ok: false, error: `Pilihan tidak valid: “${q.question}”` };
      }
      if (isOtherAnswerValue(value)) {
        normalized.push({
          questionId: q.id,
          value: formatOtherAnswer(parseOtherAnswerText(value)),
        });
      } else {
        normalized.push({ questionId: q.id, value });
      }
      continue;
    }

    if (type === "checkbox") {
      if (choiceSelectableCount(options) < 2) {
        return {
          ok: false,
          error: `Opsi pertanyaan belum lengkap: “${q.question}”`,
        };
      }
      const values = parseAnswerValues(raw);
      if (values.length === 0) {
        return { ok: false, error: `Pilih minimal satu opsi: “${q.question}”` };
      }
      const normalizedValues: string[] = [];
      for (const value of values) {
        if (!isValidChoiceValue(value, options)) {
          if (isOtherAnswerValue(value) && !parseOtherAnswerText(value)) {
            return {
              ok: false,
              error: `Isi teks Lainnya: “${q.question}”`,
            };
          }
          return { ok: false, error: `Pilihan tidak valid: “${q.question}”` };
        }
        normalizedValues.push(
          isOtherAnswerValue(value)
            ? formatOtherAnswer(parseOtherAnswerText(value))
            : value
        );
      }
      normalized.push({
        questionId: q.id,
        value: serializeMultiAnswer(normalizedValues),
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
