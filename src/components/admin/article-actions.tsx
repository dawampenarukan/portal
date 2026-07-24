"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ArticleActionsProps {
  articleId: string;
  title: string;
  /** Tampilkan Hapus (role admin penuh). */
  canDelete?: boolean;
  /** Mobile: tombol outline lebih besar. */
  compact?: boolean;
}

export function ArticleActions({
  articleId,
  title,
  canDelete = true,
  compact = false,
}: ArticleActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Hapus berita "${title}"? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/articles/${articleId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        alert(data?.error || "Gagal menghapus berita");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/admin/berita/${articleId}/edit`} prefetch={false}>
        <Button
          variant={compact ? "outline" : "ghost"}
          size="sm"
          className={compact ? "min-h-11" : undefined}
        >
          Edit
        </Button>
      </Link>
      {canDelete && (
        <Button
          variant={compact ? "outline" : "ghost"}
          size="sm"
          className={
            compact
              ? "min-h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
              : "text-destructive hover:bg-destructive/10 hover:text-destructive"
          }
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "Menghapus…" : "Hapus"}
        </Button>
      )}
    </div>
  );
}
