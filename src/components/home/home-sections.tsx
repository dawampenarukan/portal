import Link from "next/link";
import { HeroArticle } from "@/components/news/hero-article";
import { NewsCard } from "@/components/news/news-card";
import { NewsListItem } from "@/components/news/news-list-item";
import { EventCarousel } from "@/components/event/event-carousel";
import { SurveyWidgetLoader } from "@/components/dashboard/survey-widget-loader";
import { MenuPreview } from "@/components/menu/menu-preview";
import { Card, CardContent } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import {
  getActiveSurveySummariesCached,
  getPublishedArticlesForListCached,
  getPublishedEventsCached,
  getPublishedPublicationsCached,
  getSurveyDataCached,
} from "@/lib/cached-queries";
import { filterUpcomingEvents } from "@/lib/event-utils";
import { safeQuery } from "@/lib/safe-db";

const emptySurvey = {
  satisfactionScore: 0,
  npsScore: 0,
  respondents: 0,
  target: 0,
  aspects: [],
  trend: [],
};

export async function HomeHeroSection() {
  const articles = await safeQuery(
    () => getPublishedArticlesForListCached(),
    [],
    "getPublishedArticles"
  );
  const hero = articles[0];
  if (!hero) return null;
  return <HeroArticle {...hero} />;
}

export async function HomeHighlightsSection() {
  const articles = await safeQuery(
    () => getPublishedArticlesForListCached(),
    [],
    "getPublishedArticles"
  );
  const highlights = articles.filter((a) => a.isHighlight);
  const popular = articles.filter((a) => a.isPopular);

  return (
    <section className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <SectionTitle emoji="✨" title="Yang Lagi Hangat" subtitle="Berita pilihan untuk kamu" />
        <div className="grid gap-4 sm:grid-cols-2">
          {highlights.map((article) => (
            <NewsCard key={article.id} {...article} />
          ))}
        </div>
      </div>
      <div>
        <SectionTitle emoji="🏆" title="Paling Disukai" />
        <Card className="charming-card overflow-hidden border-0">
          <CardContent className="divide-y divide-border/60 p-0">
            {popular.map((article, i) => (
              <Link
                key={article.id}
                href={`/berita/${article.slug}`}
                className="flex gap-3 p-4 transition hover:bg-accent/50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-extrabold text-secondary-foreground">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold leading-snug">{article.title}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export async function HomeLatestNewsSection() {
  const articles = await safeQuery(
    () => getPublishedArticlesForListCached(),
    [],
    "getPublishedArticles"
  );

  return (
    <section>
      <SectionTitle emoji="📰" title="Berita Terbaru" href="/berita" linkLabel="Lihat semua" />
      <Card className="charming-card border-0">
        <CardContent className="p-4">
          {articles.map((article) => (
            <NewsListItem key={article.id} {...article} />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

export async function HomeEventsSection() {
  const events = await safeQuery(() => getPublishedEventsCached(), [], "getPublishedEvents");
  const upcoming = filterUpcomingEvents(events);

  return (
    <section>
      <SectionTitle
        emoji="🎉"
        title="Acara Seru Mendatang"
        subtitle="Yuk ikutan kegiatan edukasi gizi!"
      />
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada event mendatang saat ini.</p>
      ) : (
        <EventCarousel events={upcoming} />
      )}
    </section>
  );
}

export async function HomePublicationsSection() {
  const publications = await safeQuery(
    () => getPublishedPublicationsCached(),
    [],
    "getPublishedPublications"
  );

  return (
    <section>
      <SectionTitle
        emoji="📊"
        title="Pencapaian Kita"
        subtitle="Laporan kinerja dan hasil survey"
        href="/kinerja"
        linkLabel="Semua laporan"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {publications.map((pub) => (
          <Card key={pub.id} className="charming-card border-0">
            <CardContent className="p-5">
              <p className="text-xs font-bold text-primary">{pub.period}</p>
              <h3 className="mt-1 font-extrabold">{pub.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{pub.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export async function HomeSurveySection() {
  const [surveyData, activeSurveys] = await Promise.all([
    safeQuery(() => getSurveyDataCached(), emptySurvey, "getSurveyData"),
    safeQuery(() => getActiveSurveySummariesCached(), [], "getActiveSurveySummaries"),
  ]);

  const fillSurveyHref =
    activeSurveys.length > 1
      ? "/kinerja"
      : activeSurveys[0]
        ? `/survey/${activeSurveys[0].id}`
        : undefined;

  return (
    <section>
      <SectionTitle
        emoji="⭐"
        title="Seberapa Puas Kita?"
        subtitle="Hasil survey kepuasan dari siswa, guru, dan orang tua"
        href="/kinerja"
        linkLabel="Lihat detail"
      />
      <SurveyWidgetLoader data={surveyData} fillSurveyHref={fillSurveyHref} />
    </section>
  );
}

export async function HomeMenuSection() {
  return (
    <section>
      <SectionTitle
        emoji="🍽️"
        title="Menu Favorit & Request"
        subtitle="Pilih kategori menu sesuai kebutuhanmu"
        href="/menu"
        linkLabel="Lihat semua menu"
      />
      <MenuPreview />
    </section>
  );
}
