"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PublicationActionsProps {
  publicationId: string;
  title: string;
}

export function PublicationActions({ publicationId, title }: PublicationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Hapus publikasi "${title}"? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/publications/${publicationId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        alert(data?.error || "Gagal menghapus publikasi");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Link href={`/admin/publikasi/${publicationId}/edit`} prefetch={false}>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </Link>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? "Menghapus…" : "Hapus"}
      </Button>
    </div>
  );
}
