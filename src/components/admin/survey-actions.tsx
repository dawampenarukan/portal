"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
interface SurveyActionsProps {
  surveyId: string;
}

export function SurveyActions({ surveyId }: SurveyActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    setLoading(true);
    await fetch(`/api/surveys/${surveyId}/publish`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Hapus survey ini?")) return;
    setLoading(true);
    await fetch(`/api/surveys/${surveyId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/admin/survey/${surveyId}/edit`} prefetch={false}>
        <Button size="sm" variant="outline">Edit</Button>
      </Link>
      <Button size="sm" variant="secondary" onClick={handlePublish} disabled={loading}>
        Tampilkan di Portal
      </Button>
      <Button size="sm" variant="ghost" onClick={handleDelete} disabled={loading}>
        Hapus
      </Button>
    </div>
  );
}
