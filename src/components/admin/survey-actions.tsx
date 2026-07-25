"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SurveyActionsProps {
  surveyId: string;
  publicationId?: string | null;
  publicationPublished?: boolean;
}

export function SurveyActions({
  surveyId,
  publicationId = null,
  publicationPublished = false,
}: SurveyActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    setLoading(true);
    await fetch(`/api/surveys/${surveyId}/publish`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Hapus survey ini? Publikasi hasil terkait juga akan terhapus.")) return;
    setLoading(true);
    await fetch(`/api/surveys/${surveyId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {publicationId ? (
        <Badge variant={publicationPublished ? "success" : "secondary"}>
          {publicationPublished ? "Di portal" : "Draft publikasi"}
        </Badge>
      ) : (
        <Badge variant="outline">Belum dipublikasikan</Badge>
      )}
      <Link href={`/admin/survey/${surveyId}/edit`} prefetch={false}>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </Link>
      {publicationId && (
        <Link href={`/admin/publikasi?edit=${encodeURIComponent(publicationId)}`} prefetch={false}>
          <Button size="sm" variant="outline">
            Lihat Publikasi
          </Button>
        </Link>
      )}
      <Button size="sm" variant="secondary" onClick={handlePublish} disabled={loading}>
        {publicationId ? "Sync & Tampilkan" : "Tampilkan di Portal"}
      </Button>
      <Button size="sm" variant="ghost" onClick={handleDelete} disabled={loading}>
        Hapus
      </Button>
    </div>
  );
}
