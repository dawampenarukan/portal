"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ORGANOLEPTIC_ITEMS_PER_PACKAGE,
  ORGANOLEPTIC_OPTIONAL_ITEM_HINT,
  ORGANOLEPTIC_REQUIRED_ITEMS,
  isOptionalOrganolepticRow,
} from "@/lib/organoleptic-meta";
import { ORGANOLEPTIK_ADMIN_BASE } from "@/lib/roles";

interface Props {
  initialFoodNames: string[];
}

function padNames(names: string[]): string[] {
  const next = [...names];
  while (next.length < ORGANOLEPTIC_ITEMS_PER_PACKAGE) next.push("");
  return next.slice(0, ORGANOLEPTIC_ITEMS_PER_PACKAGE);
}

export function OrganolepticFoodTemplateForm({ initialFoodNames }: Props) {
  const router = useRouter();
  const [names, setNames] = useState(() => padNames(initialFoodNames));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateName(index: number, value: string) {
    setNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/organoleptic/food-template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodNames: names }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan");
        setLoading(false);
        return;
      }
      router.push(ORGANOLEPTIK_ADMIN_BASE);
      router.refresh();
    } catch {
      setError("Gagal menghubungi server");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Isi {ORGANOLEPTIC_REQUIRED_ITEMS} nama wajib (baris 1–
        {ORGANOLEPTIC_REQUIRED_ITEMS}); baris ke-{ORGANOLEPTIC_ITEMS_PER_PACKAGE}{" "}
        opsional. Daftar ini otomatis terisi di form Input Checklist Baru.
      </p>

      <div className="space-y-3">
        {names.map((name, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {index + 1}
            </span>
            <Input
              value={name}
              onChange={(e) => updateName(index, e.target.value)}
              placeholder={
                isOptionalOrganolepticRow(index)
                  ? ORGANOLEPTIC_OPTIONAL_ITEM_HINT
                  : `Nama makanan ke-${index + 1}`
              }
              maxLength={120}
              required={!isOptionalOrganolepticRow(index)}
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Menyimpan…" : "Simpan template"}
      </Button>
    </form>
  );
}
