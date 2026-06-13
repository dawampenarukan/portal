import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LoginForm } from "@/components/admin/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE_NAME } from "@/lib/constants";
import { auth } from "@/auth";
import { getDefaultAdminPath } from "@/lib/roles";

export const metadata = {
  title: "Login Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user) redirect(getDefaultAdminPath(session.user.role));
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 bg-gradient-to-br from-primary via-[#3cb88a] to-sky lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <BrandLogo size="lg" tone="light" className="shadow-md" />
          <p className="mt-3 text-sm text-white/80">Panel Pengelolaan Portal</p>
        </div>

        <div className="text-white">
          <h2 className="text-3xl font-bold leading-tight">
            Kelola berita, survey, dan masukan masyarakat dalam satu dashboard.
          </h2>
          <p className="mt-4 max-w-md text-white/75">
            Panel admin untuk mengelola konten portal, memoderasi komentar, dan
            mempublikasikan hasil survey kepuasan pelanggan.
          </p>
        </div>

        <p className="text-xs text-white/50">© {new Date().getFullYear()} {SITE_NAME}</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center lg:hidden">
              <BrandLogo size="md" />
            </div>
            <CardTitle className="text-2xl">Masuk ke Admin</CardTitle>
            <CardDescription>
              Admin penuh atau akun entri organoleptik — gunakan email & password yang sesuai.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/" className="text-primary hover:underline">
                ← Kembali ke portal publik
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
