import { notFound } from "next/navigation";
import { PublicationForm } from "@/components/admin/publication-form";
import { getPublicationById } from "@/lib/queries";

export const metadata = { title: "Edit Publikasi" };

type Props = { params: Promise<{ id: string }> };

export default async function EditPublicationPage({ params }: Props) {
  const { id } = await params;
  const publication = await getPublicationById(id);
  if (!publication) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Edit Publikasi</h2>
        <p className="text-muted-foreground">{publication.title}</p>
      </div>
      <PublicationForm publication={publication} />
    </div>
  );
}
