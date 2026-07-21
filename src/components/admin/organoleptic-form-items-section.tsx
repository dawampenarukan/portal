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
  INACTIVE_FIELD_CLASS,
  SAFETY_SHORT_LABELS,
  TABLE_CONTROL_CLASS,
  TABLE_SCORE_CLASS,
  isRowInactive,
  type ItemForm,
} from "@/components/admin/organoleptic-form-types";

function rowPlaceholder(index: number): string {
  return isOptionalOrganolepticRow(index)
    ? ORGANOLEPTIC_OPTIONAL_ITEM_HINT
    : `Item paket ke-${index + 1}`;
}

interface Props {
  items: ItemForm[];
  readOnly: boolean;
  onUpdateItem: (index: number, patch: Partial<ItemForm>) => void;
}

export function OrganolepticFormItemsSection({
  items,
  readOnly,
  onUpdateItem,
}: Props) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="font-semibold">Hasil Pemeriksaan (skor 1–5)</h3>
        <p className="text-xs text-muted-foreground">
          Minimal {ORGANOLEPTIC_REQUIRED_ITEMS} item · skor 1–2 → tidak aman
          otomatis · item ke-5 opsional
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
                      placeholder={rowPlaceholder(index)}
                      title={
                        isOptionalOrganolepticRow(index)
                          ? ORGANOLEPTIC_OPTIONAL_ITEM_HINT
                          : undefined
                      }
                      className={cn(TABLE_CONTROL_CLASS, "min-w-[120px]")}
                    />
                  </td>
                  {(
                    [
                      "tasteScore",
                      "colorScore",
                      "aromaScore",
                      "textureScore",
                    ] as const
                  ).map((key) => (
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
                          onChange={(e) =>
                            onUpdateItem(index, {
                              [key]: Number(e.target.value),
                            } as Partial<ItemForm>)
                          }
                          disabled={readOnly}
                          className={TABLE_SCORE_CLASS}
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
                        className={cn(TABLE_CONTROL_CLASS, "min-w-[90px]")}
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
