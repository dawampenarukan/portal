export const DEFAULT_NPS_QUESTION = "Seberapa mungkin Anda merekomendasikan SPPG?";
export const DEFAULT_RESPONDENT_TARGET = 100;

export type SurveyQuestionInput = {
  question: string;
  type: string;
  options?: string[];
  order: number;
};

export function normalizeRespondentTarget(value: unknown): number {
  const parsed = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_RESPONDENT_TARGET;
  }
  return Math.min(parsed, 100_000);
}

export function ensureNpsQuestion(
  questions: SurveyQuestionInput[],
  npsQuestionText = DEFAULT_NPS_QUESTION
): SurveyQuestionInput[] {
  const withoutNps = questions
    .filter((q) => q.type !== "nps" && q.question.trim())
    .map((q, index) => ({ ...q, order: index }));

  const npsText = questions.find((q) => q.type === "nps")?.question.trim() || npsQuestionText.trim();

  return [
    ...withoutNps,
    {
      question: npsText || DEFAULT_NPS_QUESTION,
      type: "nps",
      order: withoutNps.length,
    },
  ];
}
