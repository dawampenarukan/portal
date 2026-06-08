import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: "Login Admin",
};

export default function AdminLoginPage() {
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
              Gunakan akun admin untuk mengakses panel pengelolaan portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action="/admin">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <Input type="email" placeholder="admin@sppg-penarukan2.id" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Password</label>
                <Input type="password" placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full">
                Masuk
              </Button>
            </form>
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
