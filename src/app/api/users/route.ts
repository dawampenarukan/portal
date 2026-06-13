import { NextResponse } from "next/server";
import {
  badRequest,
  requireSuperAdmin,
  serverError,
} from "@/lib/api-auth";
import {
  createManageableUser,
  getManageableUsers,
  isManageableUserRole,
} from "@/lib/user-queries";

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  try {
    const users = await getManageableUsers();
    return NextResponse.json(users);
  } catch {
    return serverError("Gagal memuat daftar akun");
  }
}

export async function POST(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const name = typeof body.name === "string" ? body.name : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = typeof body.role === "string" ? body.role : "";

    if (!isManageableUserRole(role)) {
      return badRequest("Role harus Admin atau Entri Organoleptik");
    }

    const user = await createManageableUser({ email, name, password, role });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal membuat akun";
    if (message.includes("ORGANOLEPTIC_ENTRY")) {
      return badRequest(
        "Role entri belum ada di database. Buka Kelola Akun → klik Perbarui Schema Database, lalu coba lagi."
      );
    }
    return badRequest(message);
  }
}
