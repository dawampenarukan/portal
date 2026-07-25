/**
 * Backfill Publication.surveyId untuk SURVEY_RESULT lama (slug → survey).
 * Usage: npm run db:link-survey-pubs
 */
import { PublicationType, PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

function buildSurveyPublicationSlug(surveyTitle: string): string {
  return slugify(`hasil-survey-${surveyTitle}`);
}

function resolveSurveyIdFromPublicationSlug(
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

function dbHostHint() {
  const url = process.env.DATABASE_URL || "";
  try {
    return new URL(url).hostname || "(no-host)";
  } catch {
    return "(invalid-DATABASE_URL)";
  }
}

async function main() {
  console.log(`Target DB: ${dbHostHint()}`);

  const [pubs, surveys] = await Promise.all([
    prisma.publication.findMany({
      where: { type: PublicationType.SURVEY_RESULT, surveyId: null },
      select: { id: true, slug: true, isPublished: true },
    }),
    prisma.survey.findMany({ select: { id: true, title: true } }),
  ]);

  let linked = 0;
  let orphan = 0;
  let removed = 0;

  for (const pub of pubs) {
    const surveyId = resolveSurveyIdFromPublicationSlug(pub.slug, surveys);
    if (!surveyId) {
      // Draft yatim tanpa survey sumber — hapus agar /kinerja & admin tidak bingung
      if (!pub.isPublished) {
        await prisma.publication.delete({ where: { id: pub.id } });
        removed += 1;
        console.log(`  removed draft orphan: ${pub.slug}`);
      } else {
        orphan += 1;
        console.log(`  orphan (published, needs review): ${pub.slug}`);
      }
      continue;
    }
    const taken = await prisma.publication.findUnique({
      where: { surveyId },
      select: { id: true },
    });
    if (taken && taken.id !== pub.id) {
      if (!pub.isPublished) {
        await prisma.publication.delete({ where: { id: pub.id } });
        removed += 1;
        console.log(`  removed draft duplicate: ${pub.slug}`);
      } else {
        orphan += 1;
        console.log(`  skip (survey already linked): ${pub.slug}`);
      }
      continue;
    }
    await prisma.publication.update({
      where: { id: pub.id },
      data: { surveyId },
    });
    linked += 1;
    console.log(`  linked: ${pub.slug} → ${surveyId}`);
  }

  console.log(`Done. Linked: ${linked}, orphan: ${orphan}, removed: ${removed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
