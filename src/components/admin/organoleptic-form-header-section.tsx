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
  /** Kunci nama pemeriksa + tempat dari profil akun login. */
  lockProfileFields?: boolean;
  profilePhone?: string | null;
  onChange: (patch: Partial<HeaderForm>) => void;
}

export function OrganolepticFormHeaderSection({
  header,
  readOnly,
  lockProfileFields = false,
  profilePhone,
  onChange,
}: Props) {
  const profileLocked = readOnly || lockProfileFields;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium">Nama Pemeriksa</label>
        <Input
          value={header.inspectorName}
          onChange={(e) => onChange({ inspectorName: e.target.value })}
          required
          disabled={readOnly}
          readOnly={lockProfileFields && !readOnly}
          placeholder="Nama asisten lapangan / pemeriksa"
          className={
            lockProfileFields
              ? "bg-muted/20 text-foreground opacity-100 disabled:opacity-100"
              : "text-foreground"
          }
        />
        {lockProfileFields && (
          <p className="mt-1 text-xs text-muted-foreground">
            Otomatis dari akun login
            {profilePhone ? ` · ${profilePhone}` : ""}
          </p>
        )}
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
          disabled={profileLocked}
          className="text-foreground"
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
          readOnly={lockProfileFields && !readOnly}
          placeholder="Nama sekolah / posyandu"
          className={
            lockProfileFields
              ? "bg-muted/20 text-foreground opacity-100 disabled:opacity-100"
              : "text-foreground"
          }
        />
        {lockProfileFields && (
          <p className="mt-1 text-xs text-muted-foreground">
            Otomatis dari Sekolah/Posyandu akun
          </p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Waktu Uji</label>
        <Select
          value={header.timing}
          onChange={(e) =>
            onChange({ timing: e.target.value as HeaderForm["timing"] })
          }
          disabled={readOnly}
          className="text-foreground"
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
          className="text-foreground"
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
          className="text-foreground"
        />
      </div>
    </div>
  );
}
