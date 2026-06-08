import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@sppgpenarukan2.id";
const ADMIN_PASSWORD = "admin123";

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, name: "Admin SPPG", role: UserRole.SUPER_ADMIN },
    create: {
      email: ADMIN_EMAIL,
      name: "Admin SPPG",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log(`Admin siap: ${admin.email} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
