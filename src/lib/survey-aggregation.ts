import "server-only";

import { Prisma, PublicationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import type { SurveyDataView } from "@/lib/types";

import { DEFAULT_NPS_QUESTION, DEFAULT_RESPONDENT_TARGET } from "@/lib/survey-defaults";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function buildSurveyPublicationSlug(surveyTitle: string): string {
  return slugify(`hasil-survey-${surveyTitle}`);
}

export function resolveSurveyIdFromPublicationSlug(
  publicationSlug: string,
  surveys: { id: string; title: string }[]
): string | null {
  for (const survey of surveys) {
    if (buildSurveyPublicationSlug(survey.title) === publicationSlug) {
      return survey.id;
    }
  }
  return null;
}

export function parseStoredChartData(data: unknown): SurveyDataView | null {
  if (!data || typeof data !== "object") return null;
  const chart = data as Partial<SurveyDataView>;
  if (
    typeof chart.satisfactionScore !== "number" ||
    typeof chart.npsScore !== "number" ||
    typeof chart.respondents !== "number"
  ) {
    return null;
  }
  return {
    satisfactionScore: chart.satisfactionScore,
    npsScore: chart.npsScore,
    respondents: chart.respondents,
    target: typeof chart.target === "number" ? chart.target : 0,
    aspects: Array.isArray(chart.aspects) ? chart.aspects : [],
    trend: Array.isArray(chart.trend) ? chart.trend : [],
  };
}

export function buildSurveySummary(chartData: SurveyDataView): string {
  if (chartData.respondents === 0) {
    return "Belum ada responden. Skor akan diperbarui otomatis setelah survey diisi.";
  }
  return `Skor kepuasan ${chartData.satisfactionScore}/5 dengan ${chartData.respondents} responden. Skor bahagia ${chartData.npsScore}.`;
}

function buildMonthlyTrend(
  responses: { createdAt: Date; answers: { questionId: string; value: string }[] }[],
  ratingQuestionIds: Set<string>
): { month: string; score: number }[] {
  const byMonth = new Map<string, number[]>();

  for (const response of responses) {
    const ratingAnswers = response.answers.filter((a) => ratingQuestionIds.has(a.questionId));
    const scores = ratingAnswers.map((a) => parseFloat(a.value)).filter((n) => !Number.isNaN(n));
    if (scores.length === 0) continue;

    const avg = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    const key = `${response.createdAt.getFullYear()}-${response.createdAt.getMonth()}`;
    const bucket = byMonth.get(key) ?? [];
    bucket.push(avg);
    byMonth.set(key, bucket);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, avgs]) => {
      const monthIndex = Number(key.split("-")[1]);
      const score = avgs.reduce((sum, value) => sum + value, 0) / avgs.length;
      return {
        month: MONTH_LABELS[monthIndex] ?? key,
        score: Math.round(score * 10) / 10,
      };
    });
}

export async function aggregateSurveyResults(surveyId: string): Promise<SurveyDataView> {
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      questions: { orderBy: { order: "asc" } },
      responses: {
        include: { answers: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!survey) {
    return {
      satisfactionScore: 0,
      npsScore: 0,
      respondents: 0,
      target: 0,
      aspects: [],
      trend: [],
    };
  }

  const respondents = survey.responses.length;
  const ratingQuestions = survey.questions.filter((q) => q.type === "rating");
  const npsQuestion = survey.questions.find((q) => q.type === "nps");
  const ratingQuestionIds = new Set(ratingQuestions.map((q) => q.id));

  const aspects = ratingQuestions.map((q) => {
    const answers = survey.responses.flatMap((r) =>
      r.answers.filter((a) => a.questionId === q.id)
    );
    const scores = answers.map((a) => parseFloat(a.value)).filter((n) => !Number.isNaN(n));
    const avg = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
    return { name: q.question, score: Math.round(avg * 10) / 10 };
  });

  const satisfactionScore =
    aspects.length > 0
      ? Math.round((aspects.reduce((sum, aspect) => sum + aspect.score, 0) / aspects.length) * 10) / 10
      : 0;

  let npsScore = 0;
  if (npsQuestion) {
    const npsAnswers = survey.responses.flatMap((r) =>
      r.answers.filter((a) => a.questionId === npsQuestion.id)
    );
    const values = npsAnswers.map((a) => parseInt(a.value, 10)).filter((n) => !Number.isNaN(n));
    if (values.length > 0) {
      const promoters = values.filter((v) => v >= 9).length;
      const detractors = values.filter((v) => v <= 6).length;
      npsScore = Math.round(((promoters - detractors) / values.length) * 100);
    }
  }

  const targetGoal =
    survey.respondentTarget > 0 ? survey.respondentTarget : DEFAULT_RESPONDENT_TARGET;
  const target =
    respondents >= targetGoal
      ? 100
      : Math.min(100, Math.round((respondents / targetGoal) * 100));

  const trend = buildMonthlyTrend(survey.responses, ratingQuestionIds);
  const now = new Date();
  const currentMonth = MONTH_LABELS[now.getMonth()];

  return {
    satisfactionScore,
    npsScore,
    respondents,
    target,
    aspects,
    trend:
      trend.length > 0
        ? trend
        : respondents > 0
          ? [{ month: currentMonth, score: satisfactionScore }]
          : [],
  };
}

export async function syncSurveyPublication(
  surveyId: string,
  options: { publish?: boolean } = {}
): Promise<SurveyDataView | null> {
  const { publish = false } = options;
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!survey) return null;

  const hasNps = survey.questions.some((q) => q.type === "nps");
  if (!hasNps) {
    await prisma.surveyQuestion.create({
      data: {
        surveyId,
        question: DEFAULT_NPS_QUESTION,
        type: "nps",
        order: survey.questions.length,
      },
    });
  }

  const chartData = await aggregateSurveyResults(surveyId);
  const chartDataJson = chartData as unknown as Prisma.InputJsonValue;
  const period = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const slug = buildSurveyPublicationSlug(survey.title);
  const summary = buildSurveySummary(chartData);

  const existing = await prisma.publication.findFirst({
    where: { slug, type: PublicationType.SURVEY_RESULT },
  });

  if (existing) {
    await prisma.publication.update({
      where: { id: existing.id },
      data: {
        title: `Hasil Survey: ${survey.title}`,
        summary,
        chartData: chartDataJson,
        ...(publish || existing.isPublished
          ? { isPublished: true, publishedAt: existing.publishedAt ?? new Date() }
          : {}),
      },
    });
  } else {
    await prisma.publication.create({
      data: {
        title: `Hasil Survey: ${survey.title}`,
        slug,
        period,
        type: PublicationType.SURVEY_RESULT,
        summary,
        content: `Ringkasan hasil survey ${survey.title}. Skor diperbarui otomatis dari jawaban responden.`,
        chartData: chartDataJson,
        isPublished: publish,
        publishedAt: publish ? new Date() : null,
      },
    });
  }

  return chartData;
}

export async function getLiveSurveyData(options?: {
  /** false = hanya baca publication.chartData (aman untuk homepage). */
  allowLiveAggregate?: boolean;
}): Promise<SurveyDataView | null> {
  const allowLiveAggregate = options?.allowLiveAggregate !== false;

  const publishedPub = await prisma.publication.findFirst({
    where: { isPublished: true, type: PublicationType.SURVEY_RESULT },
    orderBy: { publishedAt: "desc" },
    select: { chartData: true },
  });

  const fromPublished = parseStoredChartData(publishedPub?.chartData);
  if (fromPublished && fromPublished.respondents > 0) return fromPublished;

  const latestPub = await prisma.publication.findFirst({
    where: { type: PublicationType.SURVEY_RESULT },
    orderBy: { updatedAt: "desc" },
    select: { chartData: true },
  });

  const fromLatest = parseStoredChartData(latestPub?.chartData);
  if (fromLatest && fromLatest.respondents > 0) return fromLatest;

  if (!allowLiveAggregate) return null;

  const activeSurvey = await prisma.survey.findFirst({
    where: { isActive: true, responses: { some: {} } },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (activeSurvey) {
    return aggregateSurveyResults(activeSurvey.id);
  }

  const surveyWithResponses = await prisma.survey.findFirst({
    where: { responses: { some: {} } },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (surveyWithResponses) {
    return aggregateSurveyResults(surveyWithResponses.id);
  }

  return null;
}

export async function getLiveSurveyDataForPublication(
  publicationSlug: string | null | undefined,
  surveys: { id: string; title: string }[]
): Promise<SurveyDataView | null> {
  if (!publicationSlug) return null;
  const surveyId = resolveSurveyIdFromPublicationSlug(publicationSlug, surveys);
  if (!surveyId) return null;
  return aggregateSurveyResults(surveyId);
}
