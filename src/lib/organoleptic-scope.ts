import { isOrganolepticEntryRole } from "@/lib/roles";

export function getOrganolepticOwnerFilter(
  role: string | undefined | null,
  userId: string | undefined
): string | undefined {
  if (isOrganolepticEntryRole(role) && userId) return userId;
  return undefined;
}
