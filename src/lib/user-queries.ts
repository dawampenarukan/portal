import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { ManageableUserView } from "@/lib/types";

export const MANAGEABLE_USER_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ORGANOLEPTIC_ENTRY,
] as const;

export type ManageableUserRole = (typeof MANAGEABLE_USER_ROLES)[number];

export const MANAGEABLE_USER_ROLE_LABELS: Record<ManageableUserRole, string> = {
  [UserRole.SUPER_ADMIN]: "Admin",
  [UserRole.ORGANOLEPTIC_ENTRY]: "Entri Organoleptik",
};

function mapUser(row: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}): ManageableUserView {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getManageableUsers(): Promise<ManageableUserView[]> {
  const rows = await prisma.user.findMany({
    where: { role: { in: [...MANAGEABLE_USER_ROLES] } },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapUser);
}

export function isManageableUserRole(role: string): role is ManageableUserRole {
  return MANAGEABLE_USER_ROLES.includes(role as ManageableUserRole);
}

export async function createManageableUser(input: {
  email: string;
  name: string;
  password: string;
  role: ManageableUserRole;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;

  if (!email || !name || !password) {
    throw new Error("Email, nama, dan password wajib diisi");
  }
  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter");
  }
  if (!isManageableUserRole(input.role)) {
    throw new Error("Role tidak valid");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email sudah terdaftar");

  const passwordHash = await bcrypt.hash(password, 10);
  const row = await prisma.user.create({
    data: { email, name, passwordHash, role: input.role },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return mapUser(row);
}

export async function deleteManageableUser(id: string, currentUserId: string) {
  if (id === currentUserId) {
    throw new Error("Tidak bisa menghapus akun yang sedang login");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!user) throw new Error("Akun tidak ditemukan");
  if (!isManageableUserRole(user.role)) {
    throw new Error("Akun ini tidak bisa dikelola dari panel ini");
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    const adminCount = await prisma.user.count({
      where: { role: UserRole.SUPER_ADMIN },
    });
    if (adminCount <= 1) {
      throw new Error("Minimal harus ada satu akun admin");
    }
  }

  await prisma.user.delete({ where: { id } });
}

export async function updateManageableUserPassword(id: string, password: string) {
  if (!password || password.length < 6) {
    throw new Error("Password minimal 6 karakter");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!user) throw new Error("Akun tidak ditemukan");
  if (!isManageableUserRole(user.role)) {
    throw new Error("Akun ini tidak bisa dikelola dari panel ini");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });
}
