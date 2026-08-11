import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OrganolepticFoodTemplateForm } from "@/components/admin/organoleptic-food-template-form";
import { Card, CardContent } from "@/components/ui/card";
import { getOrganolepticFoodTemplateNames } from "@/lib/organoleptic-food-template";
import { ORGANOLEPTIK_ADMIN_BASE, isFullAdminRole } from "@/lib/roles";

export const metadata = { title: "Template Nama Makanan Organoleptik" };

export default async function OrganolepticFoodTemplatePage() {
  const session = await auth();
  if (!isFullAdminRole(session?.user?.role)) {
    redirect(ORGANOLEPTIK_ADMIN_BASE);
  }

  const foodNames = await getOrganolepticFoodTemplateNames();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={ORGANOLEPTIK_ADMIN_BASE}
          prefetch={false}
          className="text-sm text-primary hover:underline"
        >
          ← Kembali ke daftar checklist
        </Link>
        <h2 className="mt-2 text-2xl font-bold">Template Nama Makanan</h2>
        <p className="text-muted-foreground">
          Daftar predefined untuk kolom Nama Makanan pada uji organoleptik — khusus admin.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <OrganolepticFoodTemplateForm initialFoodNames={foodNames} />
        </CardContent>
      </Card>
    </div>
  );
}
