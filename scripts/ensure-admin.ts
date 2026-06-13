import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const USERS = [
  {
    email: "admin@sppgpenarukan2.id",
    password: "admin123",
    name: "Admin SPPG",
    role: UserRole.SUPER_ADMIN,
  },
  {
    email: "entri@sppgpenarukan2.id",
    password: "entri123",
    name: "Entri Organoleptik",
    role: UserRole.ORGANOLEPTIC_ENTRY,
  },
] as const;

async function main() {
  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const saved = await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash, name: user.name, role: user.role },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
      },
    });
    console.log(`Akun siap: ${saved.email} / ${user.password} (${user.role})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
