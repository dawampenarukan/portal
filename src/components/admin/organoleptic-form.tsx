"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ORGANOLEPTIC_ITEMS_PER_PACKAGE,
  ORGANOLEPTIC_MAX_CRITICISM_IMAGES,
  ORGANOLEPTIC_OPTIONAL_ITEM_HINT,
  ORGANOLEPTIC_PLACE_LABELS,
  ORGANOLEPTIC_REQUIRED_ITEMS,
  ORGANOLEPTIC_SAFETY_LABELS,
  ORGANOLEPTIC_SCORE_LABELS,
  ORGANOLEPTIC_SCORE_OPTIONS,
  ORGANOLEPTIC_TIMING_LABELS,
  formatInspectionDateInput,
  isOptionalOrganolepticRow,
} from "@/lib/organoleptic-meta";
import { cn } from "@/lib/utils";
import type { OrganolepticChecklistView } from "@/lib/types";

interface ItemForm {
  foodName: string;
  tasteScore: number;
  colorScore: number;
  aromaScore: number;
  textureScore: number;
  safety: "AMAN" | "TIDAK_AMAN";
  notes: string;
}

interface HeaderForm {
  inspectorName: string;
  placeType: "SEKOLAH" | "POSYANDU" | "LAINNYA";
  placeName: string;
  inspectionDate: string;
  inspectionTime: string;
  timing: "SAAT_TIBA" | "SEBELUM_DIKONSUMSI";
  criticism: string;
}

function emptyItem(): ItemForm {
  return {
    foodName: "",
    tasteScore: 5,
    colorScore: 5,
    aromaScore: 5,
    textureScore: 5,
    safety: "AMAN",
    notes: "",
  };
}

function emptyPackageItems(): ItemForm[] {
  return Array.from({ length: ORGANOLEPTIC_ITEMS_PER_PACKAGE }, () => emptyItem());
}

function padItemsToPackage(items: ItemForm[]): ItemForm[] {
  const padded = [...items];
  while (padded.length < ORGANOLEPTIC_ITEMS_PER_PACKAGE) {
    padded.push(emptyItem());
  }
  return padded.slice(0, ORGANOLEPTIC_ITEMS_PER_PACKAGE);
}

function isRowInactive(item: ItemForm): boolean {
  return !item.foodName.trim();
}

function rowPlaceholder(index: number): string {
  return isOptionalOrganolepticRow(index)
    ? ORGANOLEPTIC_OPTIONAL_ITEM_HINT
    : `Item paket ke-${index + 1}`;
}

const INACTIVE_FIELD_CLASS =
  "flex h-11 items-center justify-center rounded-2xl border-2 border-muted bg-muted/50 text-sm text-muted-foreground opacity-70";

function defaultHeader(): HeaderForm {
  const now = new Date();
  return {
    inspectorName: "",
    placeType: "SEKOLAH",
    placeName: "",
    inspectionDate: formatInspectionDateInput(now),
    inspectionTime: now.toTimeString().slice(0, 5),
    timing: "SAAT_TIBA",
    criticism: "",
  };
}

function checklistToForm(checklist: OrganolepticChecklistView): {
  header: HeaderForm;
  criticismImages: string[];
  items: ItemForm[];
} {
  return {
    header: {
      inspectorName: checklist.inspectorName,
      placeType: checklist.placeType as HeaderForm["placeType"],
      placeName: checklist.placeName,
      inspectionDate: checklist.inspectionDate,
      inspectionTime: checklist.inspectionTime,
      timing: checklist.timing as HeaderForm["timing"],
      criticism: checklist.criticism ?? "",
    },
    criticismImages: checklist.criticismImages ?? [],
    items: padItemsToPackage(
      checklist.items.map((item) => ({
        foodName: item.foodName,
        tasteScore: item.tasteScore,
        colorScore: item.colorScore,
        aromaScore: item.aromaScore,
        textureScore: item.textureScore,
        safety: item.safety as ItemForm["safety"],
        notes: item.notes ?? "",
      }))
    ),
  };
}

interface OrganolepticFormProps {
  initialData?: OrganolepticChecklistView;
  readOnly?: boolean;
}

export function OrganolepticForm({ initialData, readOnly = false }: OrganolepticFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initial = initialData ? checklistToForm(initialData) : null;
  const [header, setHeader] = useState<HeaderForm>(initial?.header ?? defaultHeader());
  const [criticismImages, setCriticismImages] = useState<string[]>(
    initial?.criticismImages ?? []
  );
  const [items, setItems] = useState<ItemForm[]>(
    initial?.items.length ? padItemsToPackage(initial.items) : emptyPackageItems()
  );
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, patch: Partial<ItemForm>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeCriticismImage(index: number) {
    setCriticismImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const remaining = ORGANOLEPTIC_MAX_CRITICISM_IMAGES - criticismImages.length;
    if (remaining <= 0) {
      setError(`Maksimal ${ORGANOLEPTIC_MAX_CRITICISM_IMAGES} gambar`);
      return;
    }

    const toUpload = files.slice(0, remaining);
    setUploadingImages(true);
    setError(null);

    try {
      const formData = new FormData();
      toUpload.forEach((file) => formData.append("files", file));
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json().catch(() => ({}))) as { urls?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Gagal upload gambar");
      setCriticismImages((prev) => [...prev, ...(data.urls ?? [])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload gambar");
    } finally {
      setUploadingImages(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;

    const filledItems = items.filter((item) => item.foodName.trim());
    if (filledItems.length < ORGANOLEPTIC_REQUIRED_ITEMS) {
      setError(`Minimal ${ORGANOLEPTIC_REQUIRED_ITEMS} item menu wajib diisi`);
      return;
    }

    const itemsToSave = filledItems.map((item) => ({
      ...item,
      foodName: item.foodName.trim(),
      notes: item.notes || null,
    }));

    setLoading(true);
    setError(null);

    const res = await fetch("/api/organoleptic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...header,
        criticismImages,
        items: itemsToSave,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Gagal menyimpan checklist");
      return;
    }

    const saved = (await res.json()) as OrganolepticChecklistView;
    router.push(`/admin/menu/organoleptik/${saved.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="rounded-2xl border bg-muted/30 p-4 text-center text-sm">
        <p className="font-semibold text-primary">CHECKLIST UJI ORGANOLEPTIK SEKOLAH ATAU POSYANDU</p>
        <p className="mt-1 text-muted-foreground">SPPG Malang Kepanjen Penarukan 2</p>
        <p className="mt-2 text-xs text-muted-foreground">
          1 lembar = 1 sekolah/posyandu = 1 paket makanan (min. {ORGANOLEPTIC_REQUIRED_ITEMS}, maks.{" "}
          {ORGANOLEPTIC_ITEMS_PER_PACKAGE} item)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Nama Pemeriksa</label>
          <Input
            value={header.inspectorName}
            onChange={(e) => setHeader((h) => ({ ...h, inspectorName: e.target.value }))}
            required
            disabled={readOnly}
            placeholder="Nama asisten lapangan / pemeriksa"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tempat Pemeriksaan</label>
          <Select
            value={header.placeType}
            onChange={(e) =>
              setHeader((h) => ({
                ...h,
                placeType: e.target.value as HeaderForm["placeType"],
              }))
            }
            disabled={readOnly}
          >
            {Object.entries(ORGANOLEPTIC_PLACE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Nama Tempat Pemeriksaan</label>
          <Input
            value={header.placeName}
            onChange={(e) => setHeader((h) => ({ ...h, placeName: e.target.value }))}
            required
            disabled={readOnly}
            placeholder="Nama sekolah / posyandu"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Waktu Uji</label>
          <Select
            value={header.timing}
            onChange={(e) =>
              setHeader((h) => ({
                ...h,
                timing: e.target.value as HeaderForm["timing"],
              }))
            }
            disabled={readOnly}
          >
            {Object.entries(ORGANOLEPTIC_TIMING_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tanggal Pemeriksaan</label>
          <Input
            type="date"
            value={header.inspectionDate}
            onChange={(e) => setHeader((h) => ({ ...h, inspectionDate: e.target.value }))}
            required
            disabled={readOnly}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Waktu Pemeriksaan</label>
          <Input
            type="time"
            value={header.inspectionTime}
            onChange={(e) => setHeader((h) => ({ ...h, inspectionTime: e.target.value }))}
            required
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-semibold">Hasil Pemeriksaan (skor 1–5)</h3>
          <p className="text-sm text-muted-foreground">
            Isi nama menu terlebih dahulu — skor dan kesimpulan aktif setelah nama diisi. Minimal{" "}
            {ORGANOLEPTIC_REQUIRED_ITEMS} item, item ke-5 boleh dikosongkan.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">No</th>
                <th className="px-3 py-2">Nama Makanan</th>
                <th className="px-3 py-2">Rasa</th>
                <th className="px-3 py-2">Warna</th>
                <th className="px-3 py-2">Aroma</th>
                <th className="px-3 py-2">Tekstur</th>
                <th className="px-3 py-2">Kesimpulan</th>
                <th className="px-3 py-2">Ket</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const rowInactive = isRowInactive(item);

                return (
                <tr
                  key={index}
                  className={cn("border-t align-top", rowInactive && "bg-muted/20")}
                >
                  <td className="px-3 py-2 font-medium">{index + 1}</td>
                  <td className="px-3 py-2">
                    <Input
                      value={item.foodName}
                      onChange={(e) => updateItem(index, { foodName: e.target.value })}
                      disabled={readOnly}
                      placeholder={rowPlaceholder(index)}
                      title={isOptionalOrganolepticRow(index) ? ORGANOLEPTIC_OPTIONAL_ITEM_HINT : undefined}
                      className="min-w-[140px]"
                    />
                  </td>
                  {(["tasteScore", "colorScore", "aromaScore", "textureScore"] as const).map(
                    (key) => (
                      <td key={key} className="px-3 py-2">
                        {rowInactive ? (
                          <div className={cn(INACTIVE_FIELD_CLASS, "min-w-[88px]")}>—</div>
                        ) : (
                          <Select
                            value={String(item[key])}
                            onChange={(e) =>
                              updateItem(index, { [key]: Number(e.target.value) } as Partial<ItemForm>)
                            }
                            disabled={readOnly}
                            className="min-w-[88px]"
                          >
                            {ORGANOLEPTIC_SCORE_OPTIONS.map((score) => (
                              <option key={score} value={score}>
                                {score}
                              </option>
                            ))}
                          </Select>
                        )}
                      </td>
                    )
                  )}
                  <td className="px-3 py-2">
                    {rowInactive ? (
                      <div className={cn(INACTIVE_FIELD_CLASS, "min-w-[130px]")}>—</div>
                    ) : (
                      <Select
                        value={item.safety}
                        onChange={(e) =>
                          updateItem(index, {
                            safety: e.target.value as ItemForm["safety"],
                          })
                        }
                        disabled={readOnly}
                        className="min-w-[130px]"
                      >
                        {Object.entries(ORGANOLEPTIC_SAFETY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {rowInactive ? (
                      <div className={cn(INACTIVE_FIELD_CLASS, "min-w-[100px]")}>—</div>
                    ) : (
                      <Input
                        value={item.notes}
                        onChange={(e) => updateItem(index, { notes: e.target.value })}
                        disabled={readOnly}
                        placeholder="Keterangan"
                        className="min-w-[100px]"
                      />
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Skor:</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {ORGANOLEPTIC_SCORE_OPTIONS.map((score) => (
              <span key={score}>
                {score} = {ORGANOLEPTIC_SCORE_LABELS[score]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium">Kritik dan Saran</label>
        <Textarea
          value={header.criticism}
          onChange={(e) => setHeader((h) => ({ ...h, criticism: e.target.value }))}
          disabled={readOnly}
          rows={3}
          placeholder="Kritik dan saran dari pemeriksa"
        />

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Lampiran gambar (opsional, maks. {ORGANOLEPTIC_MAX_CRITICISM_IMAGES})
          </p>

          {criticismImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {criticismImages.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="relative h-24 w-24 overflow-hidden rounded-xl border bg-muted/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Lampiran ${index + 1}`} className="h-full w-full object-cover" />
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeCriticismImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                      aria-label={`Hapus gambar ${index + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!readOnly && criticismImages.length < ORGANOLEPTIC_MAX_CRITICISM_IMAGES && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingImages || loading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingImages ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="mr-1 h-4 w-4" />
                )}
                {uploadingImages ? "Mengupload..." : "Upload Gambar"}
              </Button>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, atau GIF. Maks. 5MB per gambar.
              </p>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!readOnly && (
        <div className="flex gap-3">
          <Button type="submit" disabled={loading || uploadingImages}>
            {loading ? "Menyimpan..." : "Simpan Checklist"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/menu/organoleptik")}
          >
            Batal
          </Button>
        </div>
      )}
    </form>
  );
}
