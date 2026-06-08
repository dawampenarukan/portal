"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SurveyView } from "@/lib/types";

interface SurveyActionsProps {
  survey: SurveyView;
}

export function SurveyActions({ survey }: SurveyActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    setLoading(true);
    await fetch(`/api/surveys/${survey.id}/publish`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Hapus survey ini?")) return;
    setLoading(true);
    await fetch(`/api/surveys/${survey.id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Link href={`/admin/survey/${survey.id}/edit`}>
        <Button size="sm" variant="outline">Edit</Button>
      </Link>
      <Button size="sm" variant="secondary" onClick={handlePublish} disabled={loading}>
        Publikasikan ke Beranda
      </Button>
      <Button size="sm" variant="ghost" onClick={handleDelete} disabled={loading}>
        Hapus
      </Button>
    </div>
  );
}
