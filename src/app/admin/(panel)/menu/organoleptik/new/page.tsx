import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { OrganolepticFormLoader } from "@/components/admin/organoleptic-form-loader";

export const metadata = { title: "Input Uji Organoleptik" };

export default function AdminOrganoleptikNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/menu/organoleptik"
          prefetch={false}
          className="text-sm text-primary hover:underline"
        >
          ← Kembali ke daftar checklist
        </Link>
        <h2 className="mt-2 text-2xl font-bold">Input Checklist Baru</h2>
        <p className="text-muted-foreground">
          Isi sesuai formulir BGN — satu lembar per lokasi, berisi 5 item menu dalam satu paket MBG.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <OrganolepticFormLoader />
        </CardContent>
      </Card>
    </div>
  );
}
