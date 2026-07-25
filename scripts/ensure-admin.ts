import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import {
  ORGANOLEPTIC_PIC_SEEDS,
  picEmail,
  picPassword,
} from "../src/lib/organoleptic-pic-accounts";

const prisma = new PrismaClient();

const BASE_USERS = [
  {
    email: "admin@sppgpenarukan2.id",
    password: "admin123",
    name: "Admin SPPG",
    role: UserRole.SUPER_ADMIN,
    phone: null as string | null,
    schoolLocation: null as string | null,
  },
  {
    email: "entri@sppgpenarukan2.id",
    password: "entri123",
    name: "Entri Organoleptik",
    role: UserRole.ORGANOLEPTIC_ENTRY,
    phone: null as string | null,
    schoolLocation: "Contoh Lokasi",
  },
] as const;

async function upsertUser(input: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  schoolLocation?: string | null;
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const saved = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      passwordHash,
      name: input.name,
      role: input.role,
      phone: input.phone ?? null,
      schoolLocation: input.schoolLocation ?? null,
    },
    create: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role,
      phone: input.phone ?? null,
      schoolLocation: input.schoolLocation ?? null,
    },
  });
  return saved;
}

function dbHostHint() {
  const url = process.env.DATABASE_URL || "";
  try {
    return new URL(url).hostname || "(no-host)";
  } catch {
    return "(invalid-DATABASE_URL)";
  }
}

async function main() {
  console.log(`Target DB: ${dbHostHint()}`);

  for (const user of BASE_USERS) {
    const saved = await upsertUser(user);
    console.log(`Akun siap: ${saved.email} / ${user.password} (${user.role})`);
  }

  for (const pic of ORGANOLEPTIC_PIC_SEEDS) {
    const email = picEmail(pic.name);
    const password = picPassword(pic.name);
    const saved = await upsertUser({
      email,
      password,
      name: pic.name,
      role: UserRole.ORGANOLEPTIC_ENTRY,
      phone: pic.phone,
      schoolLocation: pic.schoolLocation,
    });
    console.log(`PIC: ${saved.email} / ${password} → ${pic.schoolLocation}`);
  }

  console.log(`\nSelesai: ${ORGANOLEPTIC_PIC_SEEDS.length} akun PIC + admin/entri contoh.`);
  console.log("Tip: npm run db:link-survey-pubs  → tautkan publikasi hasil survey lama.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
