import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ORGANOLEPTIC_PLACE_LABELS,
  ORGANOLEPTIC_TIMING_LABELS,
} from "@/lib/organoleptic-meta";
import type { HeaderForm } from "@/components/admin/organoleptic-form-types";

interface Props {
  header: HeaderForm;
  readOnly: boolean;
  onChange: (patch: Partial<HeaderForm>) => void;
}

export function OrganolepticFormHeaderSection({
  header,
  readOnly,
  onChange,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium">Nama Pemeriksa</label>
        <Input
          value={header.inspectorName}
          onChange={(e) => onChange({ inspectorName: e.target.value })}
          required
          disabled={readOnly}
          placeholder="Nama asisten lapangan / pemeriksa"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          Tempat Pemeriksaan
        </label>
        <Select
          value={header.placeType}
          onChange={(e) =>
            onChange({ placeType: e.target.value as HeaderForm["placeType"] })
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
        <label className="mb-1 block text-sm font-medium">
          Nama Tempat Pemeriksaan
        </label>
        <Input
          value={header.placeName}
          onChange={(e) => onChange({ placeName: e.target.value })}
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
            onChange({ timing: e.target.value as HeaderForm["timing"] })
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
        <label className="mb-1 block text-sm font-medium">
          Tanggal Pemeriksaan
        </label>
        <Input
          type="date"
          value={header.inspectionDate}
          onChange={(e) => onChange({ inspectionDate: e.target.value })}
          required
          disabled={readOnly}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          Waktu Pemeriksaan
        </label>
        <Input
          type="time"
          value={header.inspectionTime}
          onChange={(e) => onChange({ inspectionTime: e.target.value })}
          required
          disabled={readOnly}
        />
      </div>
    </div>
  );
}
