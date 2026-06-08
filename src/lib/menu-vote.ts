import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const VOTER_COOKIE = "menu_voter";
const VOTER_MAX_AGE = 60 * 60 * 24 * 365;

export async function getVoterKeyFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(VOTER_COOKIE)?.value ?? null;
}

export async function ensureVoterKey(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(VOTER_COOKIE)?.value;
  if (existing) return existing;

  const voterKey = crypto.randomUUID();
  cookieStore.set(VOTER_COOKIE, voterKey, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: VOTER_MAX_AGE,
    path: "/",
  });
  return voterKey;
}

export async function getFavoritedMenuItemIds(voterKey?: string | null): Promise<string[]> {
  if (!voterKey) return [];
  const votes = await prisma.menuItemVote.findMany({
    where: { voterKey },
    select: { menuItemId: true },
  });
  return votes.map((v) => v.menuItemId);
}

export async function toggleMenuItemVote(menuItemId: string, voterKey: string) {
  const item = await prisma.menuItem.findFirst({
    where: { id: menuItemId },
  });
  if (!item) return null;

  const existing = await prisma.menuItemVote.findUnique({
    where: { menuItemId_voterKey: { menuItemId, voterKey } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.menuItemVote.delete({ where: { id: existing.id } }),
      prisma.menuItem.update({
        where: { id: menuItemId },
        data: { votes: { decrement: 1 } },
      }),
    ]);
    const updated = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    const votes = Math.max(0, updated?.votes ?? 0);
    if (updated && updated.votes !== votes) {
      await prisma.menuItem.update({ where: { id: menuItemId }, data: { votes } });
    }
    return { votes, isFavorited: false };
  }

  await prisma.$transaction([
    prisma.menuItemVote.create({ data: { menuItemId, voterKey } }),
    prisma.menuItem.update({
      where: { id: menuItemId },
      data: { votes: { increment: 1 } },
    }),
  ]);
  const updated = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
  return { votes: updated?.votes ?? item.votes + 1, isFavorited: true };
}
