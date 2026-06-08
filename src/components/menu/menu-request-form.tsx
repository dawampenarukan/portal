"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MenuCategory } from "@/lib/menu-data";

interface MenuRequestFormProps {
  category: MenuCategory;
}

export function MenuRequestForm({ category }: MenuRequestFormProps) {
  const [submitted, setSubmitted] = useState(false);

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
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Nama Kamu *</label>
            <Input required placeholder="Contoh: Rina / Budi" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Kelas / Kategori *</label>
            <Input required placeholder={category.audience} defaultValue={category.audience} readOnly />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Menu yang Diinginkan *</label>
            <Input required placeholder="Contoh: Nasi Ayam Bakar Sayur" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Kenapa Menu Ini Disukai?</label>
            <Textarea
              rows={3}
              placeholder="Ceritakan kenapa kamu suka menu ini..."
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            📨 Kirim Request Menu
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
