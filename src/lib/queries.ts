import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArticleStatus,
  FeedbackStatus,
  MenuCategoryType,
  PublicationType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { getDaySortOrder } from "@/lib/week-days";
import { ADMIN_PAGE_SIZE, pageOffset } from "@/lib/pagination";
import {
  MENU_CATEGORY_ID_TO_TYPE,
  MENU_CATEGORY_TYPE_TO_ID,
  MenuCategoryId,
} from "@/lib/menu-meta";
import { FALLBACK_TRENDING_TOPICS } from "@/lib/trending-topics";
import {
  aggregateSurveyResults,
  buildSurveySummary,
  getLiveSurveyData,
  getLiveSurveyDataForPublication,
  resolveSurveyIdFromPublicationSlug,
} from "@/lib/survey-aggregation";
import type {
  ArticleView,
  CommentView,
  EventView,
  MenuCategoryBundle,
  PublicationView,
  SurveyDataView,
  SurveyView,
  SurveyPublicationView,
  DashboardStats,
  AdminMenuOverviewCard,
  TrendingTopicView,
} from "@/lib/types";

type ArticleRecord = {
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
};

function mapArticle(article: ArticleRecord): ArticleView {
  return {
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
}

function mapArticleAdmin(article: ArticleRecord): ArticleView {
  return {
    ...mapArticle(article),
    status: article.status,
    categoryId: article.category.id,
  };
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
  coverImage?: string | null;
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
    coverImage: event.coverImage ?? null,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
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
  return getPublishedArticlesForList();
}

export async function getPublishedArticlesForList(): Promise<ArticleView[]> {
  const articles = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      isPopular: true,
      isHighlight: true,
      publishedAt: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  return articles.map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt ?? "",
    content: "",
    category: article.category.name,
    author: article.author.name,
    publishedAt: (article.publishedAt ?? new Date()).toISOString(),
    coverImage: article.coverImage,
    isPopular: article.isPopular,
    isHighlight: article.isHighlight,
  }));
}

export async function getAllArticles(): Promise<ArticleView[]> {
  const articles = await prisma.article.findMany({
    include: { author: true, category: true },
    orderBy: { updatedAt: "desc" },
  });
  return articles.map(mapArticleAdmin);
}

export async function getAdminArticlesList(page = 1) {
  const skip = pageOffset(page);
  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        category: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.article.count(),
  ]);

  return {
    total,
    items: articles.map((article) => ({
      id: article.id,
      title: article.title,
      category: article.category.name,
      status: article.status,
    })),
  };
}

export async function getArticleById(id: string): Promise<ArticleView | null> {
  const article = await prisma.article.findUnique({
    where: { id },
    include: { author: true, category: true },
  });
  return article ? mapArticleAdmin(article) : null;
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
    select: {
      id: true,
      title: true,
      location: true,
      startAt: true,
      endAt: true,
      coverImage: true,
    },
  });
  return events.map(mapEvent);
}

export async function getAllEvents(): Promise<EventView[]> {
  const events = await prisma.event.findMany({
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      title: true,
      location: true,
      startAt: true,
      endAt: true,
      slug: true,
      description: true,
      coverImage: true,
      isPublished: true,
    },
  });
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
    select: {
      id: true,
      title: true,
      period: true,
      type: true,
      summary: true,
    },
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

export async function getAdminPublicationsList() {
  const pubs = await prisma.publication.findMany({
    select: {
      id: true,
      title: true,
      period: true,
      summary: true,
      type: true,
      isPublished: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const typeMap: Record<PublicationType, string> = {
    SURVEY_RESULT: "survey",
    PERFORMANCE_REPORT: "performance",
    INFOGRAPHIC: "infographic",
  };

  return pubs.map((pub) => ({
    id: pub.id,
    title: pub.title,
    period: pub.period,
    type: typeMap[pub.type],
    summary: pub.summary ?? "",
    isPublished: pub.isPublished,
  }));
}

export async function getSurveyPublications(): Promise<SurveyPublicationView[]> {
  const [pubs, surveys] = await Promise.all([
    prisma.publication.findMany({
      where: { type: PublicationType.SURVEY_RESULT },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        period: true,
        type: true,
        summary: true,
        content: true,
        chartData: true,
        isPublished: true,
      },
    }),
    prisma.survey.findMany({ select: { id: true, title: true } }),
  ]);

  return Promise.all(
    pubs.map(async (pub) => {
      const mapped = mapPublicationAdmin(pub);
      const surveyId = pub.slug ? resolveSurveyIdFromPublicationSlug(pub.slug, surveys) : null;
      const liveChartData = surveyId
        ? await aggregateSurveyResults(surveyId)
        : await getLiveSurveyDataForPublication(pub.slug, surveys);

      return {
        ...mapped,
        summary: liveChartData ? buildSurveySummary(liveChartData) : mapped.summary,
        chartData: liveChartData ?? null,
        isPublished: mapped.isPublished ?? false,
        surveyId,
      };
    })
  );
}

export async function getPerformancePublications(): Promise<PublicationView[]> {
  const pubs = await prisma.publication.findMany({
    where: { isPublished: true, type: { not: PublicationType.SURVEY_RESULT } },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      period: true,
      type: true,
      summary: true,
    },
  });
  return pubs.map(mapPublication);
}

export async function getPublicationById(id: string): Promise<PublicationView | null> {
  const pub = await prisma.publication.findUnique({ where: { id } });
  return pub ? mapPublicationAdmin(pub) : null;
}

export async function getSurveyData(): Promise<SurveyDataView> {
  const live = await getLiveSurveyData();
  return live ?? defaultSurveyData;
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
  const result = await getAdminCommentsList(1);
  return result.items;
}

export async function getAdminCommentsList(page = 1) {
  const skip = pageOffset(page);
  const where = { parentId: null };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      select: {
        id: true,
        content: true,
        createdAt: true,
        isApproved: true,
        articleId: true,
        guestName: true,
        author: { select: { name: true } },
        article: { select: { title: true } },
        replies: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            guestName: true,
          },
          orderBy: { createdAt: "asc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.comment.count({ where }),
  ]);

  return {
    total,
    items: comments.map((c) => ({
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
    })),
  };
}

function buildMenuBundle(
  categoryId: MenuCategoryId,
  items: {
    id: string;
    name: string;
    description: string | null;
    votes: number;
    emoji: string | null;
    category: MenuCategoryType;
  }[],
  weekly: {
    category: MenuCategoryType;
    dayLabel: string;
    menuText: string;
    emoji: string | null;
    sortOrder: number;
  }[]
): MenuCategoryBundle {
  const categoryType = MENU_CATEGORY_ID_TO_TYPE[categoryId];
  const favorites = items
    .filter((item) => item.category === categoryType)
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name))
    .map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      votes: item.votes,
      emoji: item.emoji ?? "🍽️",
    }));

  const sortedWeekly = weekly
    .filter((entry) => entry.category === categoryType)
    .sort((a, b) => getDaySortOrder(a.dayLabel) - getDaySortOrder(b.dayLabel) || a.sortOrder - b.sortOrder);

  return {
    favorites,
    thisWeek: sortedWeekly.map(
      (entry) => `${entry.emoji ?? "🍽️"} ${entry.dayLabel}: ${entry.menuText}`
    ),
  };
}

export async function getMenuDataByCategory(
  categoryId: MenuCategoryId
): Promise<MenuCategoryBundle> {
  const categoryType = MENU_CATEGORY_ID_TO_TYPE[categoryId];

  const [favorites, weekly] = await Promise.all([
    prisma.menuItem.findMany({
      where: { category: categoryType },
      orderBy: [{ votes: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        votes: true,
        emoji: true,
        category: true,
      },
    }),
    prisma.weeklyMenuEntry.findMany({
      where: { category: categoryType, isActive: true },
      select: {
        category: true,
        dayLabel: true,
        menuText: true,
        emoji: true,
        sortOrder: true,
      },
    }),
  ]);

  return buildMenuBundle(categoryId, favorites, weekly);
}

export async function getAllMenuData(): Promise<
  Record<MenuCategoryId, MenuCategoryBundle>
> {
  const ids: MenuCategoryId[] = ["porsi-kecil", "porsi-besar", "ibu-hamil", "balita"];

  const [allItems, allWeekly] = await Promise.all([
    prisma.menuItem.findMany({
      orderBy: [{ votes: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        votes: true,
        emoji: true,
        category: true,
      },
    }),
    prisma.weeklyMenuEntry.findMany({
      where: { isActive: true },
      select: {
        category: true,
        dayLabel: true,
        menuText: true,
        emoji: true,
        sortOrder: true,
      },
    }),
  ]);

  return {
    "porsi-kecil": buildMenuBundle("porsi-kecil", allItems, allWeekly),
    "porsi-besar": buildMenuBundle("porsi-besar", allItems, allWeekly),
    "ibu-hamil": buildMenuBundle("ibu-hamil", allItems, allWeekly),
    balita: buildMenuBundle("balita", allItems, allWeekly),
  };
}

export async function getMenuPreviewTopItems(): Promise<
  Record<MenuCategoryId, { emoji: string; name: string } | null>
> {
  const result = {} as Record<MenuCategoryId, { emoji: string; name: string } | null>;

  await Promise.all(
    Object.values(MenuCategoryType).map(async (type) => {
      const top = await prisma.menuItem.findFirst({
        where: { category: type },
        orderBy: { votes: "desc" },
        select: { emoji: true, name: true },
      });
      const id = MENU_CATEGORY_TYPE_TO_ID[type];
      result[id] = top ? { emoji: top.emoji ?? "🍽️", name: top.name } : null;
    })
  );

  return result;
}

export async function getAdminMenuOverview(): Promise<
  Record<MenuCategoryId, AdminMenuOverviewCard>
> {
  const ids: MenuCategoryId[] = ["porsi-kecil", "porsi-besar", "ibu-hamil", "balita"];
  const requestCounts = await getMenuRequestCounts();

  const stats = await Promise.all(
    ids.map(async (id) => {
      const categoryType = MENU_CATEGORY_ID_TO_TYPE[id];
      const [topFavorite, weeklyCount] = await Promise.all([
        prisma.menuItem.findFirst({
          where: { category: categoryType },
          orderBy: { votes: "desc" },
          select: { name: true, votes: true },
        }),
        prisma.weeklyMenuEntry.count({
          where: { category: categoryType, isActive: true },
        }),
      ]);

      return {
        id,
        topFavorite,
        weeklyCount,
      };
    })
  );

  return {
    "porsi-kecil": {
      topFavorite: stats[0].topFavorite,
      weeklyCount: stats[0].weeklyCount,
      newRequests: requestCounts["porsi-kecil"],
    },
    "porsi-besar": {
      topFavorite: stats[1].topFavorite,
      weeklyCount: stats[1].weeklyCount,
      newRequests: requestCounts["porsi-besar"],
    },
    "ibu-hamil": {
      topFavorite: stats[2].topFavorite,
      weeklyCount: stats[2].weeklyCount,
      newRequests: requestCounts["ibu-hamil"],
    },
    balita: {
      topFavorite: stats[3].topFavorite,
      weeklyCount: stats[3].weeklyCount,
      newRequests: requestCounts.balita,
    },
  };
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

export async function getAdminFeedbacksList(page = 1) {
  const skip = pageOffset(page);
  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      select: {
        id: true,
        name: true,
        title: true,
        category: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.feedback.count(),
  ]);

  return { total, items };
}

export async function getFeedbackById(id: string) {
  return prisma.feedback.findUnique({ where: { id } });
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
    respondentTarget: s.respondentTarget,
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

export async function getAdminSurveysList() {
  return prisma.survey.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      respondentTarget: true,
      isActive: true,
      _count: { select: { responses: true, questions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getActiveSurveySummaries() {
  return prisma.survey.findMany({
    where: { isActive: true },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getActiveSurveys(): Promise<SurveyView[]> {
  const surveys = await prisma.survey.findMany({
    where: { isActive: true },
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
    respondentTarget: s.respondentTarget,
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
  const surveys = await getActiveSurveys();
  return surveys[0] ?? null;
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
    respondentTarget: survey.respondentTarget,
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

export async function getMenuRequests(category?: MenuCategoryType, limit = 50) {
  return prisma.menuRequest.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      requesterName: true,
      menuName: true,
      reason: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function getAdminMenuItems(categoryId: MenuCategoryId) {
  const categoryType = MENU_CATEGORY_ID_TO_TYPE[categoryId];
  return prisma.menuItem.findMany({
    where: { category: categoryType },
    orderBy: [{ votes: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      emoji: true,
      votes: true,
      isActive: true,
    },
  });
}

export async function getAdminWeeklyMenu(categoryId: MenuCategoryId) {
  const categoryType = MENU_CATEGORY_ID_TO_TYPE[categoryId];
  const entries = await prisma.weeklyMenuEntry.findMany({
    where: { category: categoryType },
    select: {
      id: true,
      dayLabel: true,
      menuText: true,
      emoji: true,
      sortOrder: true,
      isActive: true,
    },
  });
  return entries.sort(
    (a, b) => getDaySortOrder(a.dayLabel) - getDaySortOrder(b.dayLabel) || a.sortOrder - b.sortOrder
  );
}

export async function getNewFeedbackCount(): Promise<number> {
  return prisma.feedback.count({ where: { status: FeedbackStatus.NEW } });
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

export async function getTrendingTopics(): Promise<TrendingTopicView[]> {
  const select = { id: true, title: true, slug: true } as const;

  let articles = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED, isPopular: true },
    take: 4,
    orderBy: { publishedAt: "desc" },
    select,
  });

  if (articles.length === 0) {
    articles = await prisma.article.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      take: 4,
      orderBy: { publishedAt: "desc" },
      select,
    });
  }

  if (articles.length === 0) {
    return FALLBACK_TRENDING_TOPICS;
  }

  return articles.map((a) => ({
    id: a.id,
    title: a.title,
    href: `/berita/${a.slug}`,
  }));
}
