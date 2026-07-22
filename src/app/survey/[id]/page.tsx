import { notFound } from "next/navigation";
import {
  AtmPageHeader,
  AtmPagePanel,
  AtmPageShell,
} from "@/components/layout/atm-page-shell";
import { PublicSurveyForm } from "@/components/survey/public-survey-form";
import { getSurveyByIdCached } from "@/lib/cached-queries";

export const revalidate = 60;

export const metadata = { title: "Isi Survey" };

type Props = { params: Promise<{ id: string }> };

export default async function PublicSurveyPage({ params }: Props) {
  const { id } = await params;
  const survey = await getSurveyByIdCached(id);
  if (!survey || !survey.isActive) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <AtmPageHeader
        theme="survey"
        emoji="⭐"
        title={survey.title}
        description={survey.description ?? undefined}
      />

      <AtmPageShell theme="survey">
        <AtmPagePanel variant="glass">
          <PublicSurveyForm survey={survey} />
        </AtmPagePanel>
      </AtmPageShell>
    </div>
  );
}
