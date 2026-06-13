import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrganolepticForm } from "@/components/admin/organoleptic-form";
import { OrganolepticDetailMeta } from "@/components/admin/admin-organoleptic-summary";
import { getOrganolepticChecklistById } from "@/lib/organoleptic-queries";
import { averageScores } from "@/lib/organoleptic-meta";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const checklist = await getOrganolepticChecklistById(id);
  return {
    title: checklist ? `Checklist ${checklist.placeName}` : "Detail Checklist",
  };
}

export default async function AdminOrganoleptikDetailPage({ params }: Props) {
  const { id } = await params;
  const checklist = await getOrganolepticChecklistById(id);
  if (!checklist) notFound();

  const avgs = averageScores(checklist.items);
  const unsafe = checklist.items.filter((i) => i.safety === "TIDAK_AMAN").length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/menu/organoleptik"
            prefetch={false}
            className="text-sm text-primary hover:underline"
          >
            ← Kembali ke daftar checklist
          </Link>
          <Link href="/admin/menu/organoleptik/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Input Checklist
            </Button>
          </Link>
        </div>
        <h2 className="mt-2 text-2xl font-bold">{checklist.placeName}</h2>
        <OrganolepticDetailMeta placeType={checklist.placeType} timing={checklist.timing} />
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(checklist.inspectionDate)} · {checklist.inspectionTime} · Pemeriksa:{" "}
          {checklist.inspectorName}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {unsafe > 0 ? (
            <Badge variant="popular">{unsafe} menu tidak aman</Badge>
          ) : (
            <Badge className="bg-primary/90">Semua menu aman</Badge>
          )}
          <Badge variant="secondary">Rata-rata skor {avgs.overall.toFixed(1)}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <OrganolepticForm initialData={checklist} readOnly />
        </CardContent>
      </Card>
    </div>
  );
}
