"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MenuNameAutocomplete } from "@/components/menu/menu-name-autocomplete";
import { MENU_CATEGORY_ID_TO_TYPE, MenuCategory } from "@/lib/menu-meta";
import type { TopMenuRequestView } from "@/lib/types";

interface MenuRequestFormProps {
  category: MenuCategory;
  onSubmitted?: (topRequests: TopMenuRequestView[]) => void | Promise<void>;
}

export function MenuRequestForm({ category, onSubmitted }: MenuRequestFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [menuName, setMenuName] = useState("");
  const [reason, setReason] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/menu-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName,
          category: MENU_CATEGORY_ID_TO_TYPE[category.id],
          menuName,
          reason,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal mengirim request");
      }

      const data = (await res.json()) as { topRequests?: TopMenuRequestView[] };
      await onSubmitted?.(data.topRequests ?? []);
      setSubmitted(true);
      setRequesterName("");
      setMenuName("");
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim request");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="charming-card border-0 bg-accent/50">
        <CardContent className="p-8 text-center">
          <span className="text-5xl">🎉</span>
          <h3 className="mt-3 text-lg font-extrabold text-primary">Request Terkirim!</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Terima kasih! Menu yang kamu inginkan akan dipertimbangkan untuk jadwal berikutnya.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => setSubmitted(false)}>
            Kirim Request Lain
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="charming-card border-0">
      <CardHeader>
        <CardTitle>🙋 Request Menu {category.shortLabel}</CardTitle>
        <CardDescription>
          Mau menu apa minggu depan? Tulis di sini untuk kategori {category.audience}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Nama Kamu *</label>
            <Input
              required
              placeholder="Contoh: Rina / Budi"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Kelas / Kategori *</label>
            <Input required placeholder={category.audience} value={category.audience} readOnly />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Menu yang Diinginkan *</label>
            <MenuNameAutocomplete
              categoryId={category.id}
              required
              placeholder="Contoh: Nasi Ayam Bakar Sayur"
              value={menuName}
              onChange={setMenuName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Kenapa Menu Ini Disukai?</label>
            <Textarea
              rows={3}
              placeholder="Ceritakan kenapa kamu suka menu ini..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {submitting ? "Mengirim..." : "📨 Kirim Request Menu"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
