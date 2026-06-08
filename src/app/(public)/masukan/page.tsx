"use client";

import { ImagePlus, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function MasukanPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-4xl">
          🎉
        </div>
        <h1 className="text-2xl font-extrabold text-primary">Makasih Ya!</h1>
        <p className="mt-2 text-muted-foreground">
          Masukan kamu sudah kami terima. Tim SPPG akan segera meninjau dan menindaklanjuti.
        </p>
        <Button className="mt-6" onClick={() => setSubmitted(false)}>
          Kirim Masukan Lain
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <span className="text-5xl">💬</span>
        <h1 className="mt-3 text-2xl font-extrabold text-primary">Ceritakan ke Kami</h1>
        <p className="mt-2 text-muted-foreground">
          Punya saran, kritik, atau temuan? Tulis di sini — kami dengarkan setiap suara dari
          siswa, guru, dan orang tua.
        </p>
      </div>

      <Card className="charming-card border-0">
        <CardHeader>
          <CardTitle>📝 Formulir Masukan</CardTitle>
          <CardDescription>
            Isi data kamu dan ceritakan detailnya. Boleh lampirkan foto juga ya!
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nama Lengkap *</label>
                <Input required placeholder="Nama Anda" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <Input type="email" placeholder="email@contoh.com" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Telepon</label>
                <Input placeholder="08xxxxxxxxxx" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Kategori</label>
                <Input placeholder="Saran / Kritik / Laporan Temuan" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Judul Singkat *</label>
              <Input required placeholder="Ringkasan masukan Anda" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Deskripsi Detail *</label>
              <Textarea
                required
                rows={5}
                placeholder="Jelaskan masukan atau temuan Anda secara detail..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Gambar Temuan</label>
              <div className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input p-8 transition hover:border-primary/50 hover:bg-muted/30">
                <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Klik atau seret gambar ke sini (maks. 5 foto)
                </p>
                <input type="file" accept="image/*" multiple className="hidden" />
              </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              <Send className="h-4 w-4" />
              Kirim Masukan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
