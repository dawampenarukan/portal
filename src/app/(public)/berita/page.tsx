import Link from 'next/link';
import { Suspense } from 'react';
import { NewsListItem } from '@/components/news/news-list-item';
import { BeritaCategoryFilter } from '@/components/news/berita-category-filter';
import {
  AtmPageHeader,
  AtmPagePanel,
  AtmPageShell,
} from '@/components/layout/atm-page-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPublishedArticlesForListCached } from '@/lib/cached-queries';
import {
  filterArticlesByCategory,
  parseArticleFilter,
} from '@/lib/article-categories';
import { safeQuery } from '@/lib/safe-db';

export const metadata = {
  title: 'Berita',
};

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ kategori?: string }>;
}

export default async function BeritaPage({ searchParams }: PageProps) {
  const { kategori } = await searchParams;
  const activeFilter = parseArticleFilter(kategori);

  const articles = await safeQuery(
    () => getPublishedArticlesForListCached(),
    [],
    'getPublishedArticles'
  );

  const filtered = filterArticlesByCategory(articles, activeFilter);
  const popular = articles.filter((a) => a.isPopular);

  return (
    <div className='mx-auto max-w-7xl px-4 py-8'>
      <AtmPageHeader
        theme='berita'
        emoji='📰'
        title='Berita & Informasi'
        description='Berita harian, kegiatan, dan pengumuman terbaru dari SPPG Penarukan 2.'
      />

      <AtmPageShell theme='berita' innerClassName='space-y-6'>
        <Suspense
          fallback={
            <div className='h-8 w-64 animate-pulse rounded-full bg-muted' />
          }
        >
          <BeritaCategoryFilter />
        </Suspense>

        <div className='grid gap-8 lg:grid-cols-3'>
          <AtmPagePanel variant='main' className='lg:col-span-2'>
            <Card className='border-0 bg-white/75 shadow-none backdrop-blur-sm'>
              <CardContent className='p-4'>
                {filtered.length === 0 ? (
                  <p className='py-8 text-center text-sm text-muted-foreground'>
                    Belum ada artikel untuk kategori{' '}
                    <strong className='text-foreground'>{activeFilter}</strong>.
                  </p>
                ) : (
                  filtered.map((article) => (
                    <NewsListItem key={article.id} {...article} />
                  ))
                )}
              </CardContent>
            </Card>
          </AtmPagePanel>

          <aside className='space-y-6'>
            <AtmPagePanel variant='sidebar'>
              <Card className='border-0 bg-transparent shadow-none'>
                <CardHeader className='px-0 pt-0'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <span className='flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky/35 to-lavender/35 text-sm'>
                      🔥
                    </span>
                    Terpopuler Minggu Ini
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3 px-0 pb-0'>
                  {popular.length === 0 ? (
                    <p className='text-sm text-muted-foreground'>
                      Belum ada artikel populer.
                    </p>
                  ) : (
                    popular.map((article, i) => (
                      <Link
                        key={article.id}
                        href={`/berita/${article.slug}`}
                        className='flex gap-3 text-sm'
                      >
                        <span className='font-bold text-primary'>{i + 1}.</span>
                        <span className='leading-snug hover:text-primary'>
                          {article.title}
                        </span>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </AtmPagePanel>

            <AtmPagePanel variant='sidebar'>
              <Card className='border-0 bg-transparent shadow-none'>
                <CardHeader className='px-0 pt-0'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <span className='flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-sky/35 text-sm'>
                      🏷️
                    </span>
                    Topik Pilihan
                  </CardTitle>
                </CardHeader>
                <CardContent className='flex flex-wrap gap-2 px-0 pb-0'>
                  {['MBG', 'Nutrisi', 'Survey', 'Event', 'Kinerja'].map((tag) => (
                    <Badge key={tag} variant='secondary'>
                      {tag}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            </AtmPagePanel>
          </aside>
        </div>
      </AtmPageShell>
    </div>
  );
}
