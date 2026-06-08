"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-primary-foreground/80 transition hover:bg-white/10 hover:text-white"
    >
      <LogOut className="h-4 w-4" />
      Keluar
    </button>
  );
}
