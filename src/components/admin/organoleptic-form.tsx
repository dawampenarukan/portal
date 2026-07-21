"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrganolepticFormCriticismSection } from "@/components/admin/organoleptic-form-criticism-section";
import { OrganolepticFormHeaderSection } from "@/components/admin/organoleptic-form-header-section";
import { OrganolepticFormItemsSection } from "@/components/admin/organoleptic-form-items-section";
import { OrganolepticFormPackagesSection } from "@/components/admin/organoleptic-form-packages-section";
import {
  checklistToForm,
  defaultHeader,
  emptyPackageItems,
  nonNegIntOrZero,
  padItemsToPackage,
  type HeaderForm,
  type ItemForm,
} from "@/components/admin/organoleptic-form-types";
import { Button } from "@/components/ui/button";
import {
  ORGANOLEPTIC_ITEMS_PER_PACKAGE,
  ORGANOLEPTIC_MAX_CRITICISM_IMAGES,
  ORGANOLEPTIC_REQUIRED_ITEMS,
  deriveOrganolepticSafety,
} from "@/lib/organoleptic-meta";
import type { OrganolepticChecklistView } from "@/lib/types";

interface OrganolepticFormProps {
  initialData?: OrganolepticChecklistView;
  readOnly?: boolean;
}

export function OrganolepticForm({
  initialData,
  readOnly = false,
}: OrganolepticFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initial = initialData ? checklistToForm(initialData) : null;
  const [header, setHeader] = useState<HeaderForm>(
    initial?.header ?? defaultHeader()
  );
  const [criticismImages, setCriticismImages] = useState<string[]>(
    initial?.criticismImages ?? []
  );
  const [items, setItems] = useState<ItemForm[]>(
    initial?.items.length
      ? padItemsToPackage(initial.items)
      : emptyPackageItems()
  );
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnedManual, setReturnedManual] = useState(
    () => nonNegIntOrZero(initial?.header.packagesReturned ?? "") > 0
  );

  function patchHeader(patch: Partial<HeaderForm>) {
    setHeader((h) => ({ ...h, ...patch }));
  }

  function updatePackagesReceived(raw: string) {
    const received = nonNegIntOrZero(raw);
    setHeader((h) => {
      if (returnedManual) {
        const returned = Math.min(
          nonNegIntOrZero(
            h.packagesReturned.trim() === "" ? "0" : h.packagesReturned
          ),
          received
        );
        const consumed = Math.max(0, received - returned);
        return {
          ...h,
          packagesReceived: raw === "" ? "" : String(received),
          packagesConsumed: String(consumed),
          packagesReturned: String(returned),
          returnReason: returned > 0 ? h.returnReason : "",
        };
      }

      return {
        ...h,
        packagesReceived: raw === "" ? "" : String(received),
        packagesConsumed: String(received),
        packagesReturned: "0",
        returnReason: "",
      };
    });
  }

  function updatePackagesConsumed(raw: string) {
    setReturnedManual(false);
    const consumedWanted = nonNegIntOrZero(raw);
    const receivedRaw = header.packagesReceived.trim();

    if (receivedRaw === "") {
      const consumed = consumedWanted;
      setHeader((h) => ({
        ...h,
        packagesConsumed: String(consumed),
        packagesReturned: "0",
        packagesReceived: String(consumed),
        returnReason: "",
      }));
      return;
    }

    const received = nonNegIntOrZero(receivedRaw);
    const consumed = Math.min(Math.max(0, consumedWanted), received);
    const returned = Math.max(0, received - consumed);

    setHeader((h) => ({
      ...h,
      packagesConsumed: String(consumed),
      packagesReturned: String(returned),
      returnReason: returned > 0 ? h.returnReason : "",
    }));
  }

  function updatePackagesReturned(raw: string) {
    const returnedWanted = nonNegIntOrZero(raw);
    setReturnedManual(returnedWanted > 0);

    const receivedRaw = header.packagesReceived.trim();

    if (receivedRaw === "") {
      const returned = returnedWanted;
      setHeader((h) => ({
        ...h,
        packagesReturned: String(returned),
        packagesConsumed: "0",
        packagesReceived: String(returned),
        returnReason: returned > 0 ? h.returnReason : "",
      }));
      return;
    }

    const received = nonNegIntOrZero(receivedRaw);
    const returned = Math.min(Math.max(0, returnedWanted), received);
    const consumed = Math.max(0, received - returned);

    setHeader((h) => ({
      ...h,
      packagesReturned: String(returned),
      packagesConsumed: String(consumed),
      returnReason: returned > 0 ? h.returnReason : "",
    }));
  }

  function updateItem(index: number, patch: Partial<ItemForm>) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        next.safety = deriveOrganolepticSafety(next);
        return next;
      })
    );
  }

  function removeCriticismImage(index: number) {
    setCriticismImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const remaining =
      ORGANOLEPTIC_MAX_CRITICISM_IMAGES - criticismImages.length;
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
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as {
        urls?: string[];
        error?: string;
      };
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

    const itemsToSave = filledItems.slice(0, ORGANOLEPTIC_ITEMS_PER_PACKAGE);

    let savedReceived = nonNegIntOrZero(header.packagesReceived);
    let savedConsumed = nonNegIntOrZero(header.packagesConsumed);
    let savedReturned = nonNegIntOrZero(header.packagesReturned);
    const hasPackageData =
      header.packagesReceived.trim() !== "" ||
      header.packagesConsumed.trim() !== "" ||
      header.packagesReturned.trim() !== "";

    if (hasPackageData) {
      if (returnedManual) {
        savedReceived = Math.max(
          savedReturned,
          savedReceived || savedConsumed + savedReturned
        );
        if (savedReceived <= 0) savedReceived = savedConsumed + savedReturned;
        savedReturned = Math.min(savedReturned, savedReceived);
        savedConsumed = Math.max(0, savedReceived - savedReturned);
      } else {
        if (savedReceived <= 0) {
          savedReceived = savedConsumed + savedReturned;
        }
        savedConsumed = Math.min(savedConsumed, savedReceived);
        savedReturned = Math.max(0, savedReceived - savedConsumed);
      }
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/organoleptic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...header,
        packagesReceived: hasPackageData ? savedReceived : null,
        packagesConsumed: hasPackageData ? savedConsumed : null,
        packagesReturned: hasPackageData ? savedReturned : null,
        returnReason: savedReturned > 0 ? header.returnReason.trim() : null,
        criticismImages,
        items: itemsToSave,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
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
        <p className="font-semibold text-primary">
          CHECKLIST UJI ORGANOLEPTIK SEKOLAH ATAU POSYANDU
        </p>
        <p className="mt-1 text-muted-foreground">
          SPPG Malang Kepanjen Penarukan 2
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          1 lembar = 1 sekolah/posyandu = 1 paket makanan (min.{" "}
          {ORGANOLEPTIC_REQUIRED_ITEMS}, maks. {ORGANOLEPTIC_ITEMS_PER_PACKAGE}{" "}
          item)
        </p>
      </div>

      <OrganolepticFormHeaderSection
        header={header}
        readOnly={readOnly}
        onChange={patchHeader}
      />

      <OrganolepticFormItemsSection
        items={items}
        readOnly={readOnly}
        onUpdateItem={updateItem}
      />

      <OrganolepticFormPackagesSection
        header={header}
        readOnly={readOnly}
        onReceived={updatePackagesReceived}
        onConsumed={updatePackagesConsumed}
        onReturned={updatePackagesReturned}
        onReturnReason={(value) => patchHeader({ returnReason: value })}
      />

      <OrganolepticFormCriticismSection
        criticism={header.criticism}
        criticismImages={criticismImages}
        readOnly={readOnly}
        uploadingImages={uploadingImages}
        loading={loading}
        fileInputRef={fileInputRef}
        onCriticismChange={(value) => patchHeader({ criticism: value })}
        onRemoveImage={removeCriticismImage}
        onImageUpload={handleImageUpload}
        onPickImages={() => fileInputRef.current?.click()}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!readOnly && (
        <div className="flex gap-3">
          <Button type="submit" disabled={loading || uploadingImages}>
            {loading ? "Menyimpan..." : "Simpan Checklist"}
          </Button>
          <Link href="/admin/menu/organoleptik" prefetch={false}>
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
        </div>
      )}
    </form>
  );
}
