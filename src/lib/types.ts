export interface ArticleView {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  categoryId?: string;
  author: string;
  publishedAt: string;
  coverImage: string | null;
  isPopular: boolean;
  isHighlight: boolean;
  status?: string;
}

export interface TrendingTopicView {
  id: string;
  title: string;
  href: string;
}

export interface EventView {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  slug?: string;
  description?: string | null;
  startAt?: string;
  endAt?: string | null;
  coverImage?: string | null;
  isPublished?: boolean;
}

export interface PublicationView {
  id: string;
  title: string;
  period: string;
  type: string;
  summary: string;
  content?: string;
  slug?: string;
  chartData?: SurveyDataView | null;
  isPublished?: boolean;
}

export interface SurveyPublicationView extends PublicationView {
  chartData: SurveyDataView | null;
  isPublished: boolean;
  surveyId: string | null;
}

export interface CommentView {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  isApproved?: boolean;
  articleId?: string;
  articleTitle?: string;
  replies: {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  }[];
}

export interface SurveyQuestionView {
  id: string;
  question: string;
  type: string;
  options: string[] | null;
  order: number;
}

export interface SurveyView {
  id: string;
  title: string;
  description: string | null;
  respondentTarget: number;
  isActive: boolean;
  questions: SurveyQuestionView[];
  responseCount: number;
}

export interface DashboardStats {
  articleCount: number;
  pendingComments: number;
  newFeedbacks: number;
  surveyRespondents: number;
}

export interface SurveyDataView {
  satisfactionScore: number;
  npsScore: number;
  respondents: number;
  target: number;
  aspects: { name: string; score: number }[];
  trend: { month: string; score: number }[];
}

export interface FavoriteMenuView {
  id: string;
  name: string;
  description: string;
  votes: number;
  emoji: string;
}

export interface MenuCategoryBundle {
  favorites: FavoriteMenuView[];
  thisWeek: string[];
}

export interface MenuItemAdminView {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  votes: number;
  isActive: boolean;
}

export interface WeeklyMenuEntryView {
  id: string;
  dayLabel: string;
  menuText: string;
  emoji: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuRequestView {
  id: string;
  requesterName: string;
  menuName: string;
  reason: string | null;
  status: string;
  createdAt: string;
}

export interface AdminMenuOverviewCard {
  topFavorite: { name: string; votes: number } | null;
  weeklyCount: number;
  newRequests: number;
}
