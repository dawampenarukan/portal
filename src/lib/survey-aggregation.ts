import { Prisma, PublicationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import type { SurveyDataView } from "@/lib/types";

export async function aggregateSurveyResults(surveyId: string): Promise<SurveyDataView> {
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      questions: { orderBy: { order: "asc" } },
      responses: { include: { answers: true } },
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

  const aspects = ratingQuestions.map((q) => {
    const answers = survey.responses.flatMap((r) =>
      r.answers.filter((a) => a.questionId === q.id)
    );
    const scores = answers.map((a) => parseFloat(a.value)).filter((n) => !Number.isNaN(n));
    const avg = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
    return { name: q.question, score: Math.round(avg * 10) / 10 };
  });

  const satisfactionScore =
    aspects.length > 0
      ? Math.round((aspects.reduce((s, a) => s + a.score, 0) / aspects.length) * 10) / 10
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

  const target = respondents >= 100 ? 100 : Math.round((respondents / 100) * 100);

  const trend = survey.responses
    .slice(-6)
    .map((r, i) => {
      const ratingAnswers = r.answers.filter((a) =>
        ratingQuestions.some((q) => q.id === a.questionId)
      );
      const scores = ratingAnswers.map((a) => parseFloat(a.value)).filter((n) => !Number.isNaN(n));
      const avg = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
      return {
        month: `R${i + 1}`,
        score: Math.round(avg * 10) / 10,
      };
    });

  return {
    satisfactionScore,
    npsScore,
    respondents,
    target,
    aspects,
    trend: trend.length > 0 ? trend : [{ month: "Jun", score: satisfactionScore }],
  };
}

export async function syncSurveyPublication(
  surveyId: string,
  options: { publish?: boolean } = {}
): Promise<SurveyDataView | null> {
  const { publish = false } = options;
  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
  if (!survey) return null;

  const chartData = await aggregateSurveyResults(surveyId);
  const chartDataJson = chartData as unknown as Prisma.InputJsonValue;
  const period = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const slug = slugify(`hasil-survey-${survey.title}`);

  const existing = await prisma.publication.findFirst({
    where: { slug, type: PublicationType.SURVEY_RESULT },
  });

  const summary = `Skor kepuasan ${chartData.satisfactionScore}/5 dengan ${chartData.respondents} responden.`;

  if (existing) {
    await prisma.publication.update({
      where: { id: existing.id },
      data: {
        title: `Hasil Survey: ${survey.title}`,
        summary,
        chartData: chartDataJson,
        ...(publish ? { isPublished: true, publishedAt: new Date() } : {}),
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
        content: `Ringkasan hasil survey ${survey.title}.`,
        chartData: chartDataJson,
        isPublished: publish,
        publishedAt: publish ? new Date() : null,
      },
    });
  }

  return chartData;
}

export async function getLiveSurveyData(): Promise<SurveyDataView | null> {
  const activeSurvey = await prisma.survey.findFirst({
    where: { isActive: true },
    include: { _count: { select: { responses: true } } },
    orderBy: { updatedAt: "desc" },
  });

  if (activeSurvey && activeSurvey._count.responses > 0) {
    return aggregateSurveyResults(activeSurvey.id);
  }

  const surveyWithResponses = await prisma.survey.findFirst({
    where: { responses: { some: {} } },
    orderBy: { updatedAt: "desc" },
  });

  if (surveyWithResponses) {
    return aggregateSurveyResults(surveyWithResponses.id);
  }

  return null;
}
