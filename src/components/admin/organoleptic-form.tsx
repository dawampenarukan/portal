'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ORGANOLEPTIC_ITEMS_PER_PACKAGE,
  ORGANOLEPTIC_MAX_CRITICISM_IMAGES,
  ORGANOLEPTIC_OPTIONAL_ITEM_HINT,
  ORGANOLEPTIC_PLACE_LABELS,
  ORGANOLEPTIC_REQUIRED_ITEMS,
  ORGANOLEPTIC_SAFETY_LABELS,
  ORGANOLEPTIC_SCORE_OPTIONS,
  ORGANOLEPTIC_TIMING_LABELS,
  deriveOrganolepticSafety,
  formatInspectionDateInput,
  isOptionalOrganolepticRow,
} from '@/lib/organoleptic-meta';
import { cn } from '@/lib/utils';
import type { OrganolepticChecklistView } from '@/lib/types';

interface ItemForm {
  foodName: string;
  tasteScore: number;
  colorScore: number;
  aromaScore: number;
  textureScore: number;
  safety: 'AMAN' | 'TIDAK_AMAN';
  notes: string;
}

interface HeaderForm {
  inspectorName: string;
  placeType: 'SEKOLAH' | 'POSYANDU' | 'LAINNYA';
  placeName: string;
  inspectionDate: string;
  inspectionTime: string;
  timing: 'SAAT_TIBA' | 'SEBELUM_DIKONSUMSI';
  packagesReceived: string;
  packagesConsumed: string;
  packagesReturned: string;
  returnReason: string;
  criticism: string;
}

function emptyItem(): ItemForm {
  return {
    foodName: '',
    tasteScore: 5,
    colorScore: 5,
    aromaScore: 5,
    textureScore: 5,
    safety: 'AMAN',
    notes: '',
  };
}

function emptyPackageItems(): ItemForm[] {
  return Array.from({ length: ORGANOLEPTIC_ITEMS_PER_PACKAGE }, () =>
    emptyItem()
  );
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
  'flex h-8 items-center justify-center rounded-lg border border-muted bg-muted/40 text-xs text-muted-foreground';

const TABLE_CONTROL_CLASS = 'h-8 rounded-lg border px-2 text-sm';
const TABLE_SCORE_CLASS =
  'h-8 w-[3.25rem] min-w-0 rounded-lg border px-1 text-center text-sm';

const SAFETY_SHORT_LABELS = {
  AMAN: 'Aman',
  TIDAK_AMAN: 'Tidak aman',
} as const;

function defaultHeader(): HeaderForm {
  const now = new Date();
  return {
    inspectorName: '',
    placeType: 'SEKOLAH',
    placeName: '',
    inspectionDate: formatInspectionDateInput(now),
    inspectionTime: now.toTimeString().slice(0, 5),
    timing: 'SAAT_TIBA',
    packagesReceived: '',
    packagesConsumed: '',
    packagesReturned: '',
    returnReason: '',
    criticism: '',
  };
}

function packageCountToInput(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

function parsePackageInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

function nonNegIntOrZero(value: string): number {
  const n = parsePackageInput(value);
  return n ?? 0;
}

function checklistToForm(checklist: OrganolepticChecklistView): {
  header: HeaderForm;
  criticismImages: string[];
  items: ItemForm[];
} {
  return {
    header: {
      inspectorName: checklist.inspectorName,
      placeType: checklist.placeType as HeaderForm['placeType'],
      placeName: checklist.placeName,
      inspectionDate: checklist.inspectionDate,
      inspectionTime: checklist.inspectionTime,
      timing: checklist.timing as HeaderForm['timing'],
      packagesReceived: packageCountToInput(checklist.packagesReceived),
      packagesConsumed: packageCountToInput(checklist.packagesConsumed),
      packagesReturned: packageCountToInput(checklist.packagesReturned),
      returnReason: checklist.returnReason ?? '',
      criticism: checklist.criticism ?? '',
    },
    criticismImages: checklist.criticismImages ?? [],
    items: padItemsToPackage(
      checklist.items.map((item) => {
        const scores = {
          tasteScore: item.tasteScore,
          colorScore: item.colorScore,
          aromaScore: item.aromaScore,
          textureScore: item.textureScore,
        };
        return {
          foodName: item.foodName,
          ...scores,
          safety: deriveOrganolepticSafety(scores),
          notes: item.notes ?? '',
        };
      })
    ),
  };
}

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
  /** true jika user mengisi dikembalikan manual → dikonsumsi yang auto-adjust. */
  const [returnedManual, setReturnedManual] = useState(
    () => nonNegIntOrZero(initial?.header.packagesReturned ?? '') > 0
  );

  /**
   * Prioritas:
   * 1. diterima → dikonsumsi ikut (= diterima), dikembalikan = 0
   * 2. ubah dikonsumsi → dikembalikan auto (= diterima − dikonsumsi)
   * 3. ubah dikembalikan manual → dikonsumsi auto (= diterima − dikembalikan)
   * Spinner naik/turun memakai logika yang sama.
   */
  function updatePackagesReceived(raw: string) {
    const received = nonNegIntOrZero(raw);
    setHeader((h) => {
      if (returnedManual) {
        const returned = Math.min(
          nonNegIntOrZero(
            h.packagesReturned.trim() === '' ? '0' : h.packagesReturned
          ),
          received
        );
        const consumed = Math.max(0, received - returned);
        return {
          ...h,
          packagesReceived: raw === '' ? '' : String(received),
          packagesConsumed: String(consumed),
          packagesReturned: String(returned),
          returnReason: returned > 0 ? h.returnReason : '',
        };
      }

      return {
        ...h,
        packagesReceived: raw === '' ? '' : String(received),
        packagesConsumed: String(received),
        packagesReturned: '0',
        returnReason: '',
      };
    });
  }

  function updatePackagesConsumed(raw: string) {
    // Edit dikonsumsi (termasuk spinner) → selalu auto-hitung dikembalikan
    setReturnedManual(false);
    const consumedWanted = nonNegIntOrZero(raw);
    const receivedRaw = header.packagesReceived.trim();

    if (receivedRaw === '') {
      const consumed = consumedWanted;
      setHeader((h) => ({
        ...h,
        packagesConsumed: String(consumed),
        packagesReturned: '0',
        packagesReceived: String(consumed),
        returnReason: '',
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
      returnReason: returned > 0 ? h.returnReason : '',
    }));
  }

  function updatePackagesReturned(raw: string) {
    const returnedWanted = nonNegIntOrZero(raw);
    setReturnedManual(returnedWanted > 0);

    const receivedRaw = header.packagesReceived.trim();

    if (receivedRaw === '') {
      const returned = returnedWanted;
      setHeader((h) => ({
        ...h,
        packagesReturned: String(returned),
        packagesConsumed: '0',
        packagesReceived: String(returned),
        returnReason: returned > 0 ? h.returnReason : '',
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
      returnReason: returned > 0 ? h.returnReason : '',
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
    e.target.value = '';
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
      toUpload.forEach((file) => formData.append('files', file));
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as {
        urls?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Gagal upload gambar');
      setCriticismImages((prev) => [...prev, ...(data.urls ?? [])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal upload gambar');
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

    const packagesReceived = parsePackageInput(header.packagesReceived);
    const packagesConsumed = parsePackageInput(header.packagesConsumed);
    const packagesReturned = parsePackageInput(header.packagesReturned);

    if (header.packagesReceived.trim() && packagesReceived === null) {
      setError('Paket diterima harus bilangan bulat ≥ 0');
      return;
    }
    if (header.packagesConsumed.trim() && packagesConsumed === null) {
      setError('Paket yang dikonsumsi harus bilangan bulat ≥ 0');
      return;
    }
    if (header.packagesReturned.trim() && packagesReturned === null) {
      setError('Paket yang dikembalikan harus bilangan bulat ≥ 0');
      return;
    }
    if ((packagesReturned ?? 0) > 0 && !header.returnReason.trim()) {
      setError('Alasan pengembalian paket wajib diisi');
      return;
    }

    const hasPackageData =
      header.packagesReceived.trim() !== '' ||
      header.packagesConsumed.trim() !== '' ||
      header.packagesReturned.trim() !== '';

    let savedReceived = packagesReceived ?? 0;
    let savedConsumed = packagesConsumed ?? 0;
    let savedReturned = packagesReturned ?? 0;

    if (hasPackageData) {
      // Selalu jaga diterima = dikonsumsi + dikembalikan
      if (returnedManual) {
        savedReturned = Math.min(
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

    const res = await fetch('/api/organoleptic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      setError(data?.error ?? 'Gagal menyimpan checklist');
      return;
    }

    const saved = (await res.json()) as OrganolepticChecklistView;
    router.push(`/admin/menu/organoleptik/${saved.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className='space-y-6'>
      <div className='rounded-2xl border bg-muted/30 p-4 text-center text-sm'>
        <p className='font-semibold text-primary'>
          CHECKLIST UJI ORGANOLEPTIK SEKOLAH ATAU POSYANDU
        </p>
        <p className='mt-1 text-muted-foreground'>
          SPPG Malang Kepanjen Penarukan 2
        </p>
        <p className='mt-2 text-xs text-muted-foreground'>
          1 lembar = 1 sekolah/posyandu = 1 paket makanan (min.{' '}
          {ORGANOLEPTIC_REQUIRED_ITEMS}, maks. {ORGANOLEPTIC_ITEMS_PER_PACKAGE}{' '}
          item)
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <div>
          <label className='mb-1 block text-sm font-medium'>
            Nama Pemeriksa
          </label>
          <Input
            value={header.inspectorName}
            onChange={(e) =>
              setHeader((h) => ({ ...h, inspectorName: e.target.value }))
            }
            required
            disabled={readOnly}
            placeholder='Nama asisten lapangan / pemeriksa'
          />
        </div>
        <div>
          <label className='mb-1 block text-sm font-medium'>
            Tempat Pemeriksaan
          </label>
          <Select
            value={header.placeType}
            onChange={(e) =>
              setHeader((h) => ({
                ...h,
                placeType: e.target.value as HeaderForm['placeType'],
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
          <label className='mb-1 block text-sm font-medium'>
            Nama Tempat Pemeriksaan
          </label>
          <Input
            value={header.placeName}
            onChange={(e) =>
              setHeader((h) => ({ ...h, placeName: e.target.value }))
            }
            required
            disabled={readOnly}
            placeholder='Nama sekolah / posyandu'
          />
        </div>
        <div>
          <label className='mb-1 block text-sm font-medium'>Waktu Uji</label>
          <Select
            value={header.timing}
            onChange={(e) =>
              setHeader((h) => ({
                ...h,
                timing: e.target.value as HeaderForm['timing'],
              }))
            }
            disabled={readOnly}
          >
            {Object.entries(ORGANOLEPTIC_TIMING_LABELS).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </Select>
        </div>
        <div>
          <label className='mb-1 block text-sm font-medium'>
            Tanggal Pemeriksaan
          </label>
          <Input
            type='date'
            value={header.inspectionDate}
            onChange={(e) =>
              setHeader((h) => ({ ...h, inspectionDate: e.target.value }))
            }
            required
            disabled={readOnly}
          />
        </div>
        <div>
          <label className='mb-1 block text-sm font-medium'>
            Waktu Pemeriksaan
          </label>
          <Input
            type='time'
            value={header.inspectionTime}
            onChange={(e) =>
              setHeader((h) => ({ ...h, inspectionTime: e.target.value }))
            }
            required
            disabled={readOnly}
          />
        </div>
      </div>

      <div className='space-y-2'>
        <div>
          <h3 className='font-semibold'>Hasil Pemeriksaan (skor 1–5)</h3>
          <p className='text-xs text-muted-foreground'>
            Minimal {ORGANOLEPTIC_REQUIRED_ITEMS} item · skor 1–2 → tidak aman
            otomatis · item ke-5 opsional
          </p>
        </div>

        <div className='overflow-x-auto rounded-xl border'>
          <table className='w-full min-w-[640px] border-collapse text-sm'>
            <thead className='bg-muted/50 text-left text-xs'>
              <tr>
                <th className='w-8 px-1.5 py-1.5 text-center'>No</th>
                <th className='min-w-[120px] px-1.5 py-1.5'>Nama Makanan</th>
                <th className='w-14 px-1 py-1.5 text-center'>Rasa</th>
                <th className='w-14 px-1 py-1.5 text-center'>Warna</th>
                <th className='w-14 px-1 py-1.5 text-center'>Aroma</th>
                <th className='w-14 px-1 py-1.5 text-center'>Tekstur</th>
                <th className='w-[6.5rem] px-1.5 py-1.5 text-center'>
                  Kesimpulan
                </th>
                <th className='min-w-[90px] px-1.5 py-1.5'>Ket</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const rowInactive = isRowInactive(item);

                return (
                  <tr
                    key={index}
                    className={cn(
                      'border-t align-middle',
                      rowInactive && 'bg-muted/20'
                    )}
                  >
                    <td className='px-1.5 py-1 text-center text-xs font-medium text-muted-foreground'>
                      {index + 1}
                    </td>
                    <td className='px-1.5 py-1'>
                      <Input
                        value={item.foodName}
                        onChange={(e) =>
                          updateItem(index, { foodName: e.target.value })
                        }
                        disabled={readOnly}
                        placeholder={rowPlaceholder(index)}
                        title={
                          isOptionalOrganolepticRow(index)
                            ? ORGANOLEPTIC_OPTIONAL_ITEM_HINT
                            : undefined
                        }
                        className={cn(TABLE_CONTROL_CLASS, 'min-w-[120px]')}
                      />
                    </td>
                    {(
                      [
                        'tasteScore',
                        'colorScore',
                        'aromaScore',
                        'textureScore',
                      ] as const
                    ).map((key) => (
                      <td key={key} className='px-1 py-1'>
                        {rowInactive ? (
                          <div
                            className={cn(
                              INACTIVE_FIELD_CLASS,
                              'w-[3.25rem] mx-auto'
                            )}
                          >
                            —
                          </div>
                        ) : (
                          <Select
                            value={String(item[key])}
                            onChange={(e) =>
                              updateItem(index, {
                                [key]: Number(e.target.value),
                              } as Partial<ItemForm>)
                            }
                            disabled={readOnly}
                            className={cn(TABLE_SCORE_CLASS, 'mx-auto')}
                            aria-label={`${key} baris ${index + 1}`}
                          >
                            {ORGANOLEPTIC_SCORE_OPTIONS.map((score) => (
                              <option key={score} value={score}>
                                {score}
                              </option>
                            ))}
                          </Select>
                        )}
                      </td>
                    ))}
                    <td className='px-1.5 py-1'>
                      {rowInactive ? (
                        <div
                          className={cn(INACTIVE_FIELD_CLASS, 'mx-auto w-full')}
                        >
                          —
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'mx-auto flex h-8 w-full items-center justify-center rounded-md px-1.5 text-center text-[11px] font-semibold leading-tight',
                            item.safety === 'TIDAK_AMAN'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-primary/10 text-primary'
                          )}
                          title={ORGANOLEPTIC_SAFETY_LABELS[item.safety]}
                        >
                          {SAFETY_SHORT_LABELS[item.safety]}
                        </div>
                      )}
                    </td>
                    <td className='px-1.5 py-1'>
                      {rowInactive ? (
                        <div className={cn(INACTIVE_FIELD_CLASS, 'w-full')}>
                          —
                        </div>
                      ) : (
                        <Input
                          value={item.notes}
                          onChange={(e) =>
                            updateItem(index, { notes: e.target.value })
                          }
                          disabled={readOnly}
                          placeholder='Ket'
                          className={cn(TABLE_CONTROL_CLASS, 'min-w-[90px]')}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className='text-[11px] text-muted-foreground'>
          Skor: 5 Sangat baik · 4 Baik · 3 Cukup · 2 Kurang · 1 Tidak baik ·
          Kesimpulan otomatis dari skor.
        </p>
      </div>

      <div className='space-y-3 rounded-xl border bg-muted/20 p-4'>
        <div>
          <h3 className='text-sm font-semibold'>Jumlah Paket Makanan</h3>
          <p className='text-xs text-muted-foreground'>
            Spinner/ketik dikonsumsi → dikembalikan auto. Isi dikembalikan
            manual → dikonsumsi auto. Maks. masing-masing ≤ diterima.
          </p>
        </div>
        <div className='grid gap-3 sm:grid-cols-3'>
          <div>
            <label className='mb-1 block text-xs font-medium'>
              Paket diterima
            </label>
            <Input
              type='number'
              min={0}
              step={1}
              inputMode='numeric'
              value={header.packagesReceived}
              onChange={(e) => updatePackagesReceived(e.target.value)}
              disabled={readOnly}
              placeholder='0'
              className='h-10'
            />
          </div>
          <div>
            <label className='mb-1 block text-xs font-medium'>
              Paket dikonsumsi
            </label>
            <Input
              type='number'
              min={0}
              max={
                header.packagesReceived.trim()
                  ? nonNegIntOrZero(header.packagesReceived)
                  : undefined
              }
              step={1}
              inputMode='numeric'
              value={header.packagesConsumed}
              onChange={(e) => updatePackagesConsumed(e.target.value)}
              disabled={readOnly}
              placeholder='0'
              className='h-10'
            />
          </div>
          <div>
            <label className='mb-1 block text-xs font-medium'>
              Paket dikembalikan
            </label>
            <Input
              type='number'
              min={0}
              max={
                header.packagesReceived.trim()
                  ? nonNegIntOrZero(header.packagesReceived)
                  : undefined
              }
              step={1}
              inputMode='numeric'
              value={header.packagesReturned}
              onChange={(e) => updatePackagesReturned(e.target.value)}
              disabled={readOnly}
              placeholder='0'
              className='h-10'
            />
          </div>
        </div>
        {Number(header.packagesReturned) > 0 && (
          <div>
            <label className='mb-1 block text-xs font-medium'>
              Alasan paket dikembalikan{' '}
              <span className='text-destructive'>*</span>
            </label>
            <Textarea
              value={header.returnReason}
              onChange={(e) =>
                setHeader((h) => ({ ...h, returnReason: e.target.value }))
              }
              disabled={readOnly}
              rows={2}
              required
              placeholder='Contoh: basi, kemasan rusak, dll'
            />
          </div>
        )}
      </div>

      <div className='space-y-3'>
        <label className='block text-sm font-medium'>Kritik dan Saran</label>
        <Textarea
          value={header.criticism}
          onChange={(e) =>
            setHeader((h) => ({ ...h, criticism: e.target.value }))
          }
          disabled={readOnly}
          rows={3}
          placeholder='Kritik dan saran dari pemeriksa'
        />

        <div className='space-y-2'>
          <p className='text-sm text-muted-foreground'>
            Lampiran gambar (opsional, maks. {ORGANOLEPTIC_MAX_CRITICISM_IMAGES}
            )
          </p>

          {criticismImages.length > 0 && (
            <div className='flex flex-wrap gap-3'>
              {criticismImages.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className='relative h-24 w-24 overflow-hidden rounded-xl border bg-muted/30'
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Lampiran ${index + 1}`}
                    className='h-full w-full object-cover'
                  />
                  {!readOnly && (
                    <button
                      type='button'
                      onClick={() => removeCriticismImage(index)}
                      className='absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80'
                      aria-label={`Hapus gambar ${index + 1}`}
                    >
                      <X className='h-3 w-3' />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!readOnly &&
            criticismImages.length < ORGANOLEPTIC_MAX_CRITICISM_IMAGES && (
              <>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/jpeg,image/png,image/webp,image/gif'
                  multiple
                  className='hidden'
                  onChange={handleImageUpload}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={uploadingImages || loading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImages ? (
                    <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                  ) : (
                    <ImagePlus className='mr-1 h-4 w-4' />
                  )}
                  {uploadingImages ? 'Mengupload...' : 'Upload Gambar'}
                </Button>
                <p className='text-xs text-muted-foreground'>
                  JPEG, PNG, WebP, atau GIF. Maks. 5MB per gambar.
                </p>
              </>
            )}
        </div>
      </div>

      {error && <p className='text-sm text-destructive'>{error}</p>}

      {!readOnly && (
        <div className='flex gap-3'>
          <Button type='submit' disabled={loading || uploadingImages}>
            {loading ? 'Menyimpan...' : 'Simpan Checklist'}
          </Button>
          <Link href='/admin/menu/organoleptik' prefetch={false}>
            <Button type='button' variant='outline'>
              Batal
            </Button>
          </Link>
        </div>
      )}
    </form>
  );
}
