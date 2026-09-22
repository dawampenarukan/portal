"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SurveyDownloadButtonProps {
  surveyId: string;
  responseCount?: number;
  size?: "sm" | "default";
  variant?: "outline" | "secondary" | "default";
  className?: string;
}

export function SurveyDownloadButton({
  surveyId,
  responseCount,
  size = "sm",
  variant = "outline",
  className,
}: SurveyDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const empty = typeof responseCount === "number" && responseCount <= 0;

  async function handleDownload() {
    if (inFlight.current || empty) return;
    inFlight.current = true;
    setLoading(true);
    let objectUrl: string | null = null;
    try {
      const res = await fetch(`/api/surveys/${surveyId}/unduh`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error ?? "Gagal mengunduh hasil survey");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `Hasil-Survey-${surveyId}.xlsx`;

      objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Gagal mengunduh hasil survey. Periksa koneksi lalu coba lagi.");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      onClick={() => void handleDownload()}
      disabled={loading || empty}
      title={empty ? "Belum ada responden untuk diunduh" : "Unduh hasil survey (Excel)"}
    >
      <Download className="h-4 w-4" />
      {loading ? "Mengunduh..." : "Unduh Excel"}
    </Button>
  );
}
