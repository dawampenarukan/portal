"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackDeleteButtonProps {
  feedbackId: string;
  title: string;
}

export function FeedbackDeleteButton({
  feedbackId,
  title,
}: FeedbackDeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Hapus masukan "${title}"?\n\nTindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error ?? "Gagal menghapus masukan");
        return;
      }
      router.refresh();
    } catch {
      alert("Gagal menghubungi server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => void handleDelete()}
      disabled={loading}
      aria-label={`Hapus masukan ${title}`}
      title="Hapus"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
