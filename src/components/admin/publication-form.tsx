"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PublicationView } from "@/lib/types";

interface PublicationFormProps {
  publication?: PublicationView;
}

export function PublicationForm({ publication }: PublicationFormProps) {
  const router = useRouter();
  const isSurveyResult = publication?.type === "survey";
  const [title, setTitle] = useState(publication?.title ?? "");
  const [period, setPeriod] = useState(publication?.period ?? "");
  const [summary, setSummary] = useState(publication?.summary ?? "");
  const [content, setContent] = useState(publication?.content ?? "");
  const [type, setType] = useState(publication?.type ?? "performance");
  const [isPublished, setIsPublished] = useState(publication?.isPublished ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const typeMap: Record<string, string> = {
    survey: "SURVEY_RESULT",
    performance: "PERFORMANCE_REPORT",
    infographic: "INFOGRAPHIC",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setInfo("");

    const payload = {
      title,
      period,
      summary,
      content,
      type: typeMap[type] ?? "PERFORMANCE_REPORT",
      isPublished,
    };

    const url = publication ? `/api/publications/${publication.id}` : "/api/publications";
    const method = publication ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan");
      return;
    }

    router.push("/admin/publikasi");
    router.refresh();
  }

  async function handleSyncFromSurvey() {
    if (!publication?.surveyId) return;
    setSyncing(true);
    setError("");
    setInfo("");
    const res = await fetch(`/api/surveys/${publication.surveyId}/publish`, {
      method: "POST",
    });
    setSyncing(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal sync dari survey");
      return;
    }
    setInfo("Berhasil sync ulang dari survey.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {isSurveyResult && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-foreground">Publikasi Hasil Survey</p>
          <p className="mt-1 text-muted-foreground">
            Chart dan tautan dikelola dari Kelola Survey. Ubah metadata di sini jika perlu, atau
            sync ulang skor dari jawaban terbaru.
          </p>
          {publication?.surveyId ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/admin/survey/${publication.surveyId}/edit`} prefetch={false}>
                <Button type="button" size="sm" variant="outline">
                  Buka Survey sumber
                </Button>
              </Link>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleSyncFromSurvey}
                disabled={syncing}
              >
                {syncing ? "Sync..." : "Sync ulang dari Survey"}
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-destructive">
              Publikasi ini belum tertaut ke survey. Jalankan migrasi / publish ulang dari Kelola
              Survey.
            </p>
          )}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium">Judul *</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isSurveyResult}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Periode *</label>
          <Input value={period} onChange={(e) => setPeriod(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Tipe</label>
          {isSurveyResult ? (
            <Input value="Hasil Survey" disabled />
          ) : (
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="performance">Laporan Kinerja</option>
              <option value="infographic">Infografis</option>
            </select>
          )}
          {!publication && (
            <p className="mt-1 text-xs text-muted-foreground">
              Hasil Survey dibuat dari Kelola Survey → Tampilkan di Portal.
            </p>
          )}
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Ringkasan</label>
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          disabled={isSurveyResult}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Konten *</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          required
          disabled={isSurveyResult}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        Publikasikan
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {info && <p className="text-sm text-primary">{info}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : publication ? "Perbarui" : "Simpan"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
      </div>
    </form>
  );
}
