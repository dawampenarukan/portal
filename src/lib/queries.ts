import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArticleStatus,
  FeedbackStatus,
  MenuCategoryType,
  PublicationType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  MENU_CATEGORY_ID_TO_TYPE,
  MENU_CATEGORY_TYPE_TO_ID,
  MenuCategoryId,
} from "@/lib/menu-meta";
import type {
  ArticleView,
  CommentView,
  EventView,
  MenuCategoryBundle,
  PublicationView,
  SurveyDataView,
  SurveyView,
  DashboardStats,
} from "@/lib/types";

function mapArticle(
  article: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    coverImage: string | null;
    isPopular: boolean;
    isHighlight: boolean;
    status?: ArticleStatus;
    publishedAt: Date | null;
    author: { name: string };
    category: { id: string; name: string };
  },
  includeAdmin = false
): ArticleView {
  const base: ArticleView = {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt ?? "",
    content: article.content,
    category: article.category.name,
    author: article.author.name,
    publishedAt: (article.publishedAt ?? new Date()).toISOString(),
    coverImage: article.coverImage,
    isPopular: article.isPopular,
    isHighlight: article.isHighlight,
  };
  if (includeAdmin) {
    base.status = article.status;
    base.categoryId = article.category.id;
  }
  return base;
}

function mapEventAdmin(event: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string;
  startAt: Date;
  endAt: Date | null;
  coverImage: string | null;
  isPublished: boolean;
}): EventView {
  return {
    ...mapEvent(event),
    slug: event.slug,
    description: event.description,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
    coverImage: event.coverImage,
    isPublished: event.isPublished,
  };
}

function mapEvent(event: {
  id: string;
  title: string;
  location: string;
  startAt: Date;
  endAt: Date | null;
}): EventView {
  const end = event.endAt ?? event.startAt;
  const sameDay = format(event.startAt, "d MMMM yyyy", { locale: localeId });
  const timeRange = `${format(event.startAt, "HH.mm")} – ${format(end, "HH.mm")} WIB`;

  return {
    id: event.id,
    title: event.title,
    location: event.location,
    date: sameDay,
    time: timeRange,
  };
}

function mapPublication(pub: {
  id: string;
  title: string;
  period: string;
  type: PublicationType;
  summary: string | null;
}): PublicationView {
  const typeMap: Record<PublicationType, string> = {
    SURVEY_RESULT: "survey",
    PERFORMANCE_REPORT: "performance",
    INFOGRAPHIC: "infographic",
  };

  return {
    id: pub.id,
    title: pub.title,
    period: pub.period,
    type: typeMap[pub.type],
    summary: pub.summary ?? "",
  };
}

const defaultSurveyData: SurveyDataView = {
  satisfactionScore: 0,
  npsScore: 0,
  respondents: 0,
  target: 0,
  aspects: [],
  trend: [],
};

export async function getPublishedArticles(): Promise<ArticleView[]> {
  const articles = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    include: { author: true, category: true },
    orderBy: { publishedAt: "desc" },
  });
  return articles.map((a) => mapArticle(a));
}

export async function getAllArticles(): Promise<ArticleView[]> {
  const articles = await prisma.article.findMany({
    include: { author: true, category: true },
    orderBy: { updatedAt: "desc" },
  });
  return articles.map((a) => mapArticle(a, true));
}

export async function getArticleById(id: string): Promise<ArticleView | null> {
  const article = await prisma.article.findUnique({
    where: { id },
    include: { author: true, category: true },
  });
  return article ? mapArticle(article, true) : null;
}

export async function getArticleBySlug(slug: string): Promise<ArticleView | null> {
  const article = await prisma.article.findFirst({
    where: { slug, status: ArticleStatus.PUBLISHED },
    include: { author: true, category: true },
  });
  return article ? mapArticle(article) : null;
}

export async function getPublishedEvents(): Promise<EventView[]> {
  const events = await prisma.event.findMany({
    where: { isPublished: true },
    orderBy: { startAt: "asc" },
  });
  return events.map(mapEvent);
}

export async function getAllEvents(): Promise<EventView[]> {
  const events = await prisma.event.findMany({ orderBy: { startAt: "asc" } });
  return events.map(mapEventAdmin);
}

export async function getEventById(id: string): Promise<EventView | null> {
  const event = await prisma.event.findUnique({ where: { id } });
  return event ? mapEventAdmin(event) : null;
}

export async function getPublishedPublications(): Promise<PublicationView[]> {
  const pubs = await prisma.publication.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
  });
  return pubs.map(mapPublication);
}

function mapPublicationAdmin(pub: {
  id: string;
  slug: string;
  title: string;
  period: string;
  type: PublicationType;
  summary: string | null;
  content: string;
  chartData: unknown;
  isPublished: boolean;
}): PublicationView {
  const typeMap: Record<PublicationType, string> = {
    SURVEY_RESULT: "survey",
    PERFORMANCE_REPORT: "performance",
    INFOGRAPHIC: "infographic",
  };

  return {
    id: pub.id,
    title: pub.title,
    slug: pub.slug,
    period: pub.period,
    type: typeMap[pub.type],
    summary: pub.summary ?? "",
    content: pub.content,
    chartData: pub.chartData as unknown as SurveyDataView | null,
    isPublished: pub.isPublished,
  };
}

export async function getAllPublications(): Promise<PublicationView[]> {
  const pubs = await prisma.publication.findMany({ orderBy: { updatedAt: "desc" } });
  return pubs.map(mapPublicationAdmin);
}

export async function getPublicationById(id: string): Promise<PublicationView | null> {
  const pub = await prisma.publication.findUnique({ where: { id } });
  return pub ? mapPublicationAdmin(pub) : null;
}

export async function getSurveyData(): Promise<SurveyDataView> {
  const pub = await prisma.publication.findFirst({
    where: { isPublished: true, type: PublicationType.SURVEY_RESULT },
    orderBy: { publishedAt: "desc" },
  });

  if (!pub?.chartData) return defaultSurveyData;

  const data = pub.chartData as unknown as SurveyDataView;
  return {
    satisfactionScore: data.satisfactionScore ?? 0,
    npsScore: data.npsScore ?? 0,
    respondents: data.respondents ?? 0,
    target: data.target ?? 0,
    aspects: data.aspects ?? [],
    trend: data.trend ?? [],
  };
}

export async function getArticleComments(articleId: string): Promise<CommentView[]> {
  const comments = await prisma.comment.findMany({
    where: { articleId, isApproved: true, parentId: null },
    include: {
      replies: {
        where: { isApproved: true },
        orderBy: { createdAt: "asc" },
      },
      author: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return comments.map((c) => ({
    id: c.id,
    authorName: c.guestName ?? c.author?.name ?? "Anonim",
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    replies: c.replies.map((r) => ({
      id: r.id,
      authorName: r.guestName ?? "Admin SPPG",
      content: r.content,
      createdAt: r.createdAt.toISOString(),
    })),
  }));
}

export async function getAllComments(): Promise<
  (CommentView & { articleTitle: string })[]
> {
  const comments = await prisma.comment.findMany({
    include: {
      article: true,
      replies: true,
      author: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return comments
    .filter((c) => !c.parentId)
    .map((c) => ({
      id: c.id,
      authorName: c.guestName ?? c.author?.name ?? "Anonim",
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      isApproved: c.isApproved,
      articleId: c.articleId,
      articleTitle: c.article.title,
      replies: c.replies.map((r) => ({
        id: r.id,
        authorName: r.guestName ?? "Admin SPPG",
        content: r.content,
        createdAt: r.createdAt.toISOString(),
      })),
    }));
}

export async function getMenuDataByCategory(
  categoryId: MenuCategoryId
): Promise<MenuCategoryBundle> {
  const categoryType = MENU_CATEGORY_ID_TO_TYPE[categoryId];

  const [favorites, weekly] = await Promise.all([
    prisma.menuItem.findMany({
      where: { category: categoryType, isActive: true },
      orderBy: { votes: "desc" },
      take: 10,
    }),
    prisma.weeklyMenuEntry.findMany({
      where: { category: categoryType, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return {
    favorites: favorites.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      votes: item.votes,
      emoji: item.emoji ?? "🍽️",
    })),
    thisWeek: weekly.map((entry) => `${entry.dayLabel}: ${entry.menuText}`),
  };
}

export async function getAllMenuData(): Promise<
  Record<MenuCategoryId, MenuCategoryBundle>
> {
  const ids: MenuCategoryId[] = ["porsi-kecil", "porsi-besar", "ibu-hamil", "balita"];
  const entries = await Promise.all(ids.map((id) => getMenuDataByCategory(id)));

  return {
    "porsi-kecil": entries[0],
    "porsi-besar": entries[1],
    "ibu-hamil": entries[2],
    balita: entries[3],
  };
}

export async function getMenuPreviewTopItems(): Promise<
  Record<MenuCategoryId, { emoji: string; name: string } | null>
> {
  const result = {} as Record<MenuCategoryId, { emoji: string; name: string } | null>;

  for (const type of Object.values(MenuCategoryType)) {
    const top = await prisma.menuItem.findFirst({
      where: { category: type, isActive: true },
      orderBy: { votes: "desc" },
    });
    const id = MENU_CATEGORY_TYPE_TO_ID[type];
    result[id] = top ? { emoji: top.emoji ?? "🍽️", name: top.name } : null;
  }

  return result;
}

export async function getMenuRequestCounts(): Promise<Record<MenuCategoryId, number>> {
  const counts = await prisma.menuRequest.groupBy({
    by: ["category"],
    where: { status: FeedbackStatus.NEW },
    _count: { _all: true },
  });

  const result: Record<MenuCategoryId, number> = {
    "porsi-kecil": 0,
    "porsi-besar": 0,
    "ibu-hamil": 0,
    balita: 0,
  };

  for (const row of counts) {
    const id = MENU_CATEGORY_TYPE_TO_ID[row.category];
    result[id] = row._count._all;
  }

  return result;
}

export async function getAllFeedbacks() {
  return prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getAllSurveys(): Promise<SurveyView[]> {
  const surveys = await prisma.survey.findMany({
    include: {
      questions: { orderBy: { order: "asc" } },
      _count: { select: { responses: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return surveys.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    isActive: s.isActive,
    responseCount: s._count.responses,
    questions: s.questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options as string[] | null,
      order: q.order,
    })),
  }));
}

export async function getActiveSurvey(): Promise<SurveyView | null> {
  const survey = await prisma.survey.findFirst({
    where: { isActive: true },
    include: {
      questions: { orderBy: { order: "asc" } },
      _count: { select: { responses: true } },
    },
  });
  if (!survey) return null;

  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    isActive: survey.isActive,
    responseCount: survey._count.responses,
    questions: survey.questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options as string[] | null,
      order: q.order,
    })),
  };
}

export async function getSurveyById(id: string): Promise<SurveyView | null> {
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" } },
      _count: { select: { responses: true } },
    },
  });
  if (!survey) return null;

  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    isActive: survey.isActive,
    responseCount: survey._count.responses,
    questions: survey.questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options as string[] | null,
      order: q.order,
    })),
  };
}

export async function getWeeklyMenuEntries(categoryId: MenuCategoryId) {
  const categoryType = MENU_CATEGORY_ID_TO_TYPE[categoryId];
  return prisma.weeklyMenuEntry.findMany({
    where: { category: categoryType, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getMenuItemsByCategory(categoryId: MenuCategoryId) {
  const categoryType = MENU_CATEGORY_ID_TO_TYPE[categoryId];
  return prisma.menuItem.findMany({
    where: { category: categoryType, isActive: true },
    orderBy: { votes: "desc" },
  });
}

export async function getMenuRequests(category?: MenuCategoryType) {
  return prisma.menuRequest.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [articleCount, pendingComments, newFeedbacks, surveyRespondents] = await Promise.all([
    prisma.article.count(),
    prisma.comment.count({ where: { isApproved: false, parentId: null } }),
    prisma.feedback.count({ where: { status: FeedbackStatus.NEW } }),
    prisma.surveyResponse.count(),
  ]);

  return { articleCount, pendingComments, newFeedbacks, surveyRespondents };
}

export async function getTrendingTopics(): Promise<string[]> {
  const popular = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED, isPopular: true },
    take: 4,
    orderBy: { publishedAt: "desc" },
  });

  if (popular.length === 0) {
    return [
      "Menu Favorit Minggu Ini 🍽️",
      "Request Menu Porsi Kecil 🧒",
      "Tips Gizi Buat Ibu Hamil 🤰",
      "Yuk Isi Survey! ⭐",
    ];
  }

  return popular.map((a) => a.title);
}
