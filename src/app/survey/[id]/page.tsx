import { notFound } from "next/navigation";
import { PublicSurveyForm } from "@/components/survey/public-survey-form";
import { getSurveyById } from "@/lib/queries";

export const metadata = { title: "Isi Survey" };

type Props = { params: Promise<{ id: string }> };

export default async function PublicSurveyPage({ params }: Props) {
  const { id } = await params;
  const survey = await getSurveyById(id);
  if (!survey || !survey.isActive) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <span className="text-5xl">⭐</span>
        <h1 className="mt-3 text-2xl font-extrabold text-primary">{survey.title}</h1>
        {survey.description && (
          <p className="mt-2 text-muted-foreground">{survey.description}</p>
        )}
      </div>
      <PublicSurveyForm survey={survey} />
    </div>
  );
}
