"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  MANAGEABLE_USER_ROLE_LABELS,
  USER_ROLE_ORGANOLEPTIC_ENTRY,
  USER_ROLE_SUPER_ADMIN,
  type ManageableUserRole,
} from "@/lib/user-constants";
import { formatDate } from "@/lib/utils";
import type { ManageableUserView } from "@/lib/types";

interface UserAccountsManagerProps {
  initialUsers: ManageableUserView[];
  currentUserId: string;
}

export function UserAccountsManager({ initialUsers, currentUserId }: UserAccountsManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<ManageableUserRole>(USER_ROLE_ORGANOLEPTIC_ENTRY);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [passwordEditId, setPasswordEditId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPasswordId, setSavingPasswordId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    setSubmitting(false);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Gagal membuat akun");
      return;
    }

    setUsers((prev) => [...prev, data as ManageableUserView]);
    setName("");
    setEmail("");
    setPassword("");
    setRole(USER_ROLE_ORGANOLEPTIC_ENTRY);
    setSuccess("Akun berhasil ditambahkan");
    router.refresh();
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Hapus akun ${label}?`)) return;
    setDeletingId(id);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    setDeletingId(null);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Gagal menghapus akun");
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (passwordEditId === id) {
      setPasswordEditId(null);
      setNewPassword("");
    }
    setSuccess("Akun berhasil dihapus");
    router.refresh();
  }

  function togglePasswordEdit(id: string) {
    setError("");
    setSuccess("");
    if (passwordEditId === id) {
      setPasswordEditId(null);
      setNewPassword("");
      return;
    }
    setPasswordEditId(id);
    setNewPassword("");
  }

  async function handlePasswordUpdate(id: string, label: string) {
    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setSavingPasswordId(id);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });

    setSavingPasswordId(null);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Gagal mengubah password");
      return;
    }

    setPasswordEditId(null);
    setNewPassword("");
    setSuccess(`Password ${label} berhasil diubah`);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
        <h3 className="font-semibold">Tambah Akun Baru</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Nama</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <Select value={role} onChange={(e) => setRole(e.target.value as ManageableUserRole)}>
              <option value={USER_ROLE_SUPER_ADMIN}>
                {MANAGEABLE_USER_ROLE_LABELS[USER_ROLE_SUPER_ADMIN]}
              </option>
              <option value={USER_ROLE_ORGANOLEPTIC_ENTRY}>
                {MANAGEABLE_USER_ROLE_LABELS[USER_ROLE_ORGANOLEPTIC_ENTRY]}
              </option>
            </Select>
          </div>
        </div>
        {error && !passwordEditId && <p className="text-sm text-destructive">{error}</p>}
        {success && !passwordEditId && <p className="text-sm text-primary">{success}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Tambah Akun"}
        </Button>
      </form>

      <div className="space-y-3">
        <h3 className="font-semibold">Daftar Akun ({users.length})</h3>
        {users.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Belum ada akun terdaftar.
          </p>
        ) : (
          users.map((user) => {
            const isSelf = user.id === currentUserId;
            const isEditingPassword = passwordEditId === user.id;
            const roleLabel =
              MANAGEABLE_USER_ROLE_LABELS[user.role as ManageableUserRole] ?? user.role;

            return (
              <div
                key={user.id}
                className="rounded-2xl border bg-card p-4 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Dibuat {formatDate(user.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={user.role === USER_ROLE_SUPER_ADMIN ? "default" : "secondary"}>
                      {roleLabel}
                    </Badge>
                    {isSelf && <Badge variant="outline">Akun Anda</Badge>}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePasswordEdit(user.id)}
                    >
                      <KeyRound className="mr-1 h-4 w-4" />
                      Ubah Password
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isSelf || deletingId === user.id}
                      onClick={() => handleDelete(user.id, user.email)}
                    >
                      <Trash2 className="mr-1 h-4 w-4 text-destructive" />
                      Hapus
                    </Button>
                  </div>
                </div>

                {isEditingPassword && (
                  <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-3">
                    <div className="min-w-[200px] flex-1">
                      <label className="mb-1 block text-sm font-medium">Password Baru</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                        placeholder="Minimal 6 karakter"
                        autoFocus
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={savingPasswordId === user.id}
                      onClick={() => handlePasswordUpdate(user.id, user.email)}
                    >
                      {savingPasswordId === user.id ? "Menyimpan..." : "Simpan Password"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePasswordEdit(user.id)}
                    >
                      Batal
                    </Button>
                    {error && isEditingPassword && (
                      <p className="w-full text-sm text-destructive">{error}</p>
                    )}
                    {success && isEditingPassword && (
                      <p className="w-full text-sm text-primary">{success}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
