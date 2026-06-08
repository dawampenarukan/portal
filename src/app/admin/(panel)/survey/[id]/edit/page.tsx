import { notFound } from "next/navigation";
import { SurveyForm } from "@/components/admin/survey-form";
import { getSurveyById } from "@/lib/queries";

export const metadata = { title: "Edit Survey" };

type Props = { params: Promise<{ id: string }> };

export default async function EditSurveyPage({ params }: Props) {
  const { id } = await params;
  const survey = await getSurveyById(id);
  if (!survey) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Edit Survey</h2>
        <p className="text-muted-foreground">{survey.title}</p>
      </div>
      <SurveyForm survey={survey} />
    </div>
  );
}
