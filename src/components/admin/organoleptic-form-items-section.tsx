"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ORGANOLEPTIC_ITEMS_PER_PACKAGE,
  ORGANOLEPTIC_OPTIONAL_ITEM_HINT,
  ORGANOLEPTIC_REQUIRED_ITEMS,
  ORGANOLEPTIC_SAFETY_LABELS,
  ORGANOLEPTIC_SCORE_OPTIONS,
  isOptionalOrganolepticRow,
} from "@/lib/organoleptic-meta";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ORGANOLEPTIC_SCORE,
  INACTIVE_FIELD_CLASS,
  READONLY_FIELD_CLASS,
  SAFETY_SHORT_LABELS,
  TABLE_CONTROL_CLASS,
  TABLE_FOOD_NAME_LOCKED_CLASS,
  TABLE_SCORE_CLASS,
  TABLE_SCORE_DEFAULT_CLASS,
  isRowInactive,
  type ItemForm,
} from "@/components/admin/organoleptic-form-types";

type ScoreKey = "tasteScore" | "colorScore" | "aromaScore" | "textureScore";

function rowPlaceholder(index: number): string {
  return isOptionalOrganolepticRow(index)
    ? ORGANOLEPTIC_OPTIONAL_ITEM_HINT
    : `Item paket ke-${index + 1}`;
}

function scoreTouchKey(index: number, key: ScoreKey) {
  return `${index}:${key}`;
}

interface Props {
  items: ItemForm[];
  readOnly: boolean;
  /** Nama dari template admin — tidak bisa diubah di form checklist. */
  lockFoodNames?: boolean;
  onUpdateItem: (index: number, patch: Partial<ItemForm>) => void;
}

export function OrganolepticFormItemsSection({
  items,
  readOnly,
  lockFoodNames = false,
  onUpdateItem,
}: Props) {
  const [touchedScores, setTouchedScores] = useState(() => new Set<string>());

  // Reset tanda "sudah diisi" saat daftar nama berubah (ganti tanggal / template)
  const namesSignature = items.map((i) => i.foodName).join("\0");
  useEffect(() => {
    setTouchedScores(new Set());
  }, [namesSignature]);

  function markScoreTouched(index: number, key: ScoreKey) {
    const id = scoreTouchKey(index, key);
    setTouchedScores((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      <div>
        <h3 className="font-semibold">Hasil Pemeriksaan (skor 1–5)</h3>
        <p className="text-xs text-muted-foreground">
          Minimal {ORGANOLEPTIC_REQUIRED_ITEMS} item · skor 1–2 → tidak aman
          otomatis · item ke-5 opsional
          {lockFoodNames
            ? " · nama dari template (tidak bisa diubah) · skor abu = belum diisi (default 5)"
            : ""}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead className="bg-muted/50 text-left text-xs">
            <tr>
              <th className="w-8 px-1.5 py-1.5 text-center">No</th>
              <th className="min-w-[120px] px-1.5 py-1.5">Nama Makanan</th>
              <th className="w-12 px-0.5 py-1.5 text-center">Rasa</th>
              <th className="w-12 px-0.5 py-1.5 text-center">Warna</th>
              <th className="w-12 px-0.5 py-1.5 text-center">Aroma</th>
              <th className="w-12 px-0.5 py-1.5 text-center">Tekstur</th>
              <th className="w-[6.5rem] px-1.5 py-1.5 text-center">Kesimpulan</th>
              <th className="min-w-[90px] px-1.5 py-1.5">Ket</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const rowInactive = isRowInactive(item);

              return (
                <tr
                  key={index}
                  className={cn(
                    "border-t align-middle",
                    rowInactive && "bg-muted/20"
                  )}
                >
                  <td className="px-1.5 py-1 text-center text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="px-1.5 py-1">
                    <Input
                      value={item.foodName}
                      onChange={(e) =>
                        onUpdateItem(index, { foodName: e.target.value })
                      }
                      disabled={readOnly}
                      readOnly={lockFoodNames && !readOnly}
                      placeholder={rowPlaceholder(index)}
                      title={
                        lockFoodNames
                          ? "Nama dari template admin"
                          : isOptionalOrganolepticRow(index)
                            ? ORGANOLEPTIC_OPTIONAL_ITEM_HINT
                            : undefined
                      }
                      className={cn(
                        TABLE_CONTROL_CLASS,
                        "min-w-[120px]",
                        lockFoodNames && TABLE_FOOD_NAME_LOCKED_CLASS,
                        readOnly && READONLY_FIELD_CLASS
                      )}
                    />
                  </td>
                  {(
                    [
                      "tasteScore",
                      "colorScore",
                      "aromaScore",
                      "textureScore",
                    ] as const
                  ).map((key) => {
                    // Abu hanya saat input baru & skor belum disentuh; setelah simpan (readOnly) selalu hitam
                    const untouchedDefault =
                      !readOnly &&
                      !touchedScores.has(scoreTouchKey(index, key)) &&
                      item[key] === DEFAULT_ORGANOLEPTIC_SCORE;
                    return (
                      <td key={key} className="px-0.5 py-1 text-center">
                        {rowInactive ? (
                          <div
                            className={cn(
                              INACTIVE_FIELD_CLASS,
                              "mx-auto h-8 w-[3.25rem] text-xs"
                            )}
                          >
                            —
                          </div>
                        ) : (
                          <Select
                            value={String(item[key])}
                            onChange={(e) => {
                              markScoreTouched(index, key);
                              onUpdateItem(index, {
                                [key]: Number(e.target.value),
                              } as Partial<ItemForm>);
                            }}
                            disabled={readOnly}
                            className={cn(
                              TABLE_SCORE_CLASS,
                              untouchedDefault
                                ? TABLE_SCORE_DEFAULT_CLASS
                                : "text-foreground",
                              readOnly && READONLY_FIELD_CLASS
                            )}
                            aria-label={`${key} baris ${index + 1}`}
                            title={
                              untouchedDefault
                                ? "Belum diisi — default 5 (abu). Pilih skor agar menjadi hitam."
                                : undefined
                            }
                          >
                            {ORGANOLEPTIC_SCORE_OPTIONS.map((score) => (
                              <option key={score} value={score}>
                                {score}
                              </option>
                            ))}
                          </Select>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-1.5 py-1">
                    {rowInactive ? (
                      <div
                        className={cn(INACTIVE_FIELD_CLASS, "mx-auto w-full")}
                      >
                        —
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "mx-auto flex h-8 w-full items-center justify-center rounded-md px-1.5 text-center text-[11px] font-semibold leading-tight",
                          item.safety === "TIDAK_AMAN"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                        )}
                        title={ORGANOLEPTIC_SAFETY_LABELS[item.safety]}
                      >
                        {SAFETY_SHORT_LABELS[item.safety]}
                      </div>
                    )}
                  </td>
                  <td className="px-1.5 py-1">
                    {rowInactive ? (
                      <div className={cn(INACTIVE_FIELD_CLASS, "w-full")}>—</div>
                    ) : (
                      <Input
                        value={item.notes}
                        onChange={(e) =>
                          onUpdateItem(index, { notes: e.target.value })
                        }
                        disabled={readOnly}
                        placeholder="Ket"
                        className={cn(
                          TABLE_CONTROL_CLASS,
                          "min-w-[90px] text-foreground",
                          readOnly && READONLY_FIELD_CLASS
                        )}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Skor: 5 Sangat baik · 4 Baik · 3 Cukup · 2 Kurang · 1 Tidak baik ·
        Kesimpulan otomatis dari skor. ({ORGANOLEPTIC_ITEMS_PER_PACKAGE} baris)
      </p>
    </div>
  );
}
