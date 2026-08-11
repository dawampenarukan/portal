import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { OrganolepticFormLoader } from "@/components/admin/organoleptic-form-loader";
import { auth } from "@/auth";
import { getOrganolepticFoodTemplateNames } from "@/lib/organoleptic-food-template";
import { inferOrganolepticPlaceType } from "@/lib/organoleptic-pic-accounts";
import { isOrganolepticEntryRole } from "@/lib/roles";
import { getUserProfileForOrganoleptic } from "@/lib/user-queries";
import type { OrganolepticProfileDefaults } from "@/lib/types";

export const metadata = { title: "Input Uji Organoleptik" };

export default async function AdminOrganoleptikNewPage() {
  const session = await auth();
  let profileDefaults: OrganolepticProfileDefaults | null = null;

  if (session?.user?.id) {
    const profile = await getUserProfileForOrganoleptic(session.user.id);
    if (profile) {
      const placeName = profile.schoolLocation?.trim() || "";
      const lockFields =
        isOrganolepticEntryRole(profile.role) &&
        Boolean(profile.name.trim()) &&
        Boolean(placeName);

      profileDefaults = {
        inspectorName: profile.name.trim(),
        placeName,
        placeType: inferOrganolepticPlaceType(placeName),
        phone: profile.phone,
        lockFields,
      };
    }
  }

  const foodNameDefaults = await getOrganolepticFoodTemplateNames();
  const hasFoodTemplate = foodNameDefaults.some((n) => n.trim());

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
          {profileDefaults?.lockFields
            ? " Nama pemeriksa dan tempat diisi otomatis dari akun Anda."
            : ""}
          {hasFoodTemplate
            ? " Nama makanan diisi otomatis dari template admin (bisa diubah)."
            : ""}
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <OrganolepticFormLoader
            profileDefaults={profileDefaults}
            foodNameDefaults={foodNameDefaults}
          />
        </CardContent>
      </Card>
    </div>
  );
}
