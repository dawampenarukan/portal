import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  nonNegIntOrZero,
  type HeaderForm,
} from "@/components/admin/organoleptic-form-types";

interface Props {
  header: HeaderForm;
  readOnly: boolean;
  onReceived: (raw: string) => void;
  onConsumed: (raw: string) => void;
  onReturned: (raw: string) => void;
  onReturnReason: (value: string) => void;
}

export function OrganolepticFormPackagesSection({
  header,
  readOnly,
  onReceived,
  onConsumed,
  onReturned,
  onReturnReason,
}: Props) {
  const receivedMax = header.packagesReceived.trim()
    ? nonNegIntOrZero(header.packagesReceived)
    : undefined;

  return (
    <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
      <div>
        <h3 className="text-sm font-semibold">Jumlah Paket Makanan</h3>
        <p className="text-xs text-muted-foreground">
          Spinner/ketik dikonsumsi → dikembalikan auto. Isi dikembalikan manual →
          dikonsumsi auto. Maks. masing-masing ≤ diterima.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium">Paket diterima</label>
          <Input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={header.packagesReceived}
            onChange={(e) => onReceived(e.target.value)}
            disabled={readOnly}
            placeholder="0"
            className="h-10"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">
            Paket dikonsumsi
          </label>
          <Input
            type="number"
            min={0}
            max={receivedMax}
            step={1}
            inputMode="numeric"
            value={header.packagesConsumed}
            onChange={(e) => onConsumed(e.target.value)}
            disabled={readOnly}
            placeholder="0"
            className="h-10"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">
            Paket dikembalikan
          </label>
          <Input
            type="number"
            min={0}
            max={receivedMax}
            step={1}
            inputMode="numeric"
            value={header.packagesReturned}
            onChange={(e) => onReturned(e.target.value)}
            disabled={readOnly}
            placeholder="0"
            className="h-10"
          />
        </div>
      </div>
      {Number(header.packagesReturned) > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium">
            Alasan paket dikembalikan <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={header.returnReason}
            onChange={(e) => onReturnReason(e.target.value)}
            disabled={readOnly}
            rows={2}
            required
            placeholder="Contoh: basi, kemasan rusak, dll"
          />
        </div>
      )}
    </div>
  );
}
