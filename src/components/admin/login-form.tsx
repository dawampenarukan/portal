"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HealthStatus = {
  ok: boolean;
  adminExists?: boolean;
  checks?: Record<string, string>;
  error?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@sppgpenarukan2.id");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data: HealthStatus) => {
        if (!data.ok) {
          setHint(data.error ?? "Database belum terhubung. Cek /api/health");
          return;
        }
        if (data.checks?.NEXTAUTH_SECRET === "missing") {
          setHint("NEXTAUTH_SECRET belum di-set di Vercel Environment Variables.");
          return;
        }
        if (!data.adminExists) {
          setHint("Akun admin belum ada di database. Jalankan: npm run db:ensure-admin");
        }
      })
      .catch(() => {
        setHint("Tidak bisa cek status database.");
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (result.error === "Configuration") {
        setError("Konfigurasi auth belum lengkap (NEXTAUTH_SECRET / NEXTAUTH_URL).");
      } else {
        setError("Email atau password salah — atau database belum terhubung.");
      }
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Email</label>
        <Input
          type="email"
          placeholder="admin@sppgpenarukan2.id"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Password</label>
        <Input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {hint && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{hint}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
