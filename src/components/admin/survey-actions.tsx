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
    try {
      const res = await fetch(`/api/surveys/${surveyId}/publish`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error ?? "Gagal menampilkan survey di portal");
        return;
      }
      router.refresh();
    } catch {
      alert("Gagal menampilkan survey di portal. Periksa koneksi lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Hapus survey ini? Publikasi hasil terkait juga akan terhapus.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error ?? "Gagal menghapus survey");
        return;
      }
      router.refresh();
    } catch {
      alert("Gagal menghapus survey. Periksa koneksi lalu coba lagi.");
    } finally {
      setLoading(false);
    }
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
