import "server-only";

import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  MANAGEABLE_USER_ROLES,
  USER_ROLE_SUPER_ADMIN,
  isManageableUserRole,
  type ManageableUserRole,
} from "@/lib/user-constants";
import type { ManageableUserView } from "@/lib/types";

export {
  MANAGEABLE_USER_ROLES,
  MANAGEABLE_USER_ROLE_LABELS,
  isManageableUserRole,
  type ManageableUserRole,
} from "@/lib/user-constants";

function mapUser(row: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  schoolLocation: string | null;
  createdAt: Date;
}): ManageableUserView {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    phone: row.phone,
    schoolLocation: row.schoolLocation,
    createdAt: row.createdAt.toISOString(),
  };
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  schoolLocation: true,
  createdAt: true,
} as const;

export async function getManageableUsers(): Promise<ManageableUserView[]> {
  try {
    const rows = await prisma.user.findMany({
      where: { role: { in: [...MANAGEABLE_USER_ROLES] } },
      select: userSelect,
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
    return rows.map(mapUser);
  } catch (err) {
    console.error("[users] getManageableUsers:", err);
    // Fallback jika kolom phone/schoolLocation belum di-push
    const rows = await prisma.user.findMany({
      where: { role: { in: [...MANAGEABLE_USER_ROLES] } },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
    return rows.map((row) =>
      mapUser({ ...row, phone: null, schoolLocation: null })
    );
  }
}

export async function createManageableUser(input: {
  email: string;
  name: string;
  password: string;
  role: ManageableUserRole;
  phone?: string | null;
  schoolLocation?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;
  const phone = input.phone?.trim() || null;
  const schoolLocation = input.schoolLocation?.trim() || null;

  if (!email || !name || !password) {
    throw new Error("Email, nama, dan password wajib diisi");
  }
  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter");
  }
  if (!isManageableUserRole(input.role)) {
    throw new Error("Role tidak valid");
  }
  if (input.role !== USER_ROLE_SUPER_ADMIN && !schoolLocation) {
    throw new Error("Sekolah/Posyandu wajib diisi untuk akun entri organoleptik");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email sudah terdaftar");

  const passwordHash = await bcrypt.hash(password, 10);
  const row = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: input.role,
      phone,
      schoolLocation,
    },
    select: userSelect,
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

  if (user.role === USER_ROLE_SUPER_ADMIN) {
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

export async function getUserProfileForOrganoleptic(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        schoolLocation: true,
      },
    });
  } catch (err) {
    console.error("[users] getUserProfileForOrganoleptic:", err);
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });
    if (!row) return null;
    return { ...row, phone: null, schoolLocation: null };
  }
}
