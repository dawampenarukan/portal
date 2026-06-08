import { SurveyForm } from "@/components/admin/survey-form";

export const metadata = { title: "Buat Survey" };

export default function NewSurveyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Buat Survey Baru</h2>
        <p className="text-muted-foreground">Rancang kuesioner kepuasan pelanggan.</p>
      </div>
      <SurveyForm />
    </div>
  );
}
