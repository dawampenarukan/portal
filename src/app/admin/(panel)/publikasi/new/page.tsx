import { PublicationForm } from "@/components/admin/publication-form";

export const metadata = { title: "Buat Publikasi" };

export default function NewPublicationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Buat Publikasi</h2>
        <p className="text-muted-foreground">Tambah laporan kinerja atau publikasi fixed.</p>
      </div>
      <PublicationForm />
    </div>
  );
}
