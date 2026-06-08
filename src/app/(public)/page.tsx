import Link from "next/link";
import { WelcomeBanner } from "@/components/home/welcome-banner";
import { MenuPreview } from "@/components/menu/menu-preview";
import { SurveyWidget } from "@/components/dashboard/survey-widget";
import { EventCarousel } from "@/components/event/event-carousel";
import { HeroArticle } from "@/components/news/hero-article";
import { NewsCard } from "@/components/news/news-card";
import { NewsListItem } from "@/components/news/news-list-item";
import { SectionTitle } from "@/components/ui/section-title";
import { Card, CardContent } from "@/components/ui/card";
import {
  mockArticles,
  mockEvents,
  mockPublications,
} from "@/lib/mock-data";

export default function HomePage() {
  const hero = mockArticles[0];
  const highlights = mockArticles.filter((a) => a.isHighlight);
  const popular = mockArticles.filter((a) => a.isPopular);
  const latest = mockArticles;

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8">
      <WelcomeBanner />
      <HeroArticle {...hero} />

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

      <section>
        <SectionTitle
          emoji="⭐"
          title="Seberapa Puas Kita?"
          subtitle="Hasil survey kepuasan dari siswa, guru, dan orang tua"
          href="/kinerja"
          linkLabel="Lihat detail"
        />
        <SurveyWidget />
      </section>

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

      <section>
        <SectionTitle
          emoji="🎉"
          title="Acara Seru Mendatang"
          subtitle="Yuk ikutan kegiatan edukasi gizi!"
        />
        <EventCarousel events={mockEvents} />
      </section>

      <section>
        <SectionTitle
          emoji="📊"
          title="Pencapaian Kita"
          subtitle="Laporan kinerja dan hasil survey"
          href="/kinerja"
          linkLabel="Semua laporan"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {mockPublications.map((pub) => (
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

      <section>
        <SectionTitle
          emoji="📰"
          title="Berita Terbaru"
          href="/berita"
          linkLabel="Lihat semua"
        />
        <Card className="charming-card border-0">
          <CardContent className="p-4">
            {latest.map((article) => (
              <NewsListItem key={article.id} {...article} />
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
