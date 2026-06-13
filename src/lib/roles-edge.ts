/** Role helpers tanpa @prisma/client — aman untuk Edge Middleware (batas 1 MB Vercel). */

export const ORGANOLEPTIK_ADMIN_BASE = "/admin/menu/organoleptik";

const FULL_ADMIN_ROLES = new Set(["SUPER_ADMIN", "EDITOR"]);

export function isOrganolepticEntryRole(role?: string | null): boolean {
  return role === "ORGANOLEPTIC_ENTRY";
}

export function isFullAdminRole(role?: string | null): boolean {
  return !!role && FULL_ADMIN_ROLES.has(role);
}

export function canAccessAdminPanel(role?: string | null): boolean {
  return isFullAdminRole(role) || isOrganolepticEntryRole(role);
}

export function canAccessOrganoleptic(role?: string | null): boolean {
  return canAccessAdminPanel(role);
}

export function getDefaultAdminPath(role?: string | null): string {
  if (isOrganolepticEntryRole(role)) return ORGANOLEPTIK_ADMIN_BASE;
  return "/admin";
}

export function isOrganolepticEntryPath(pathname: string): boolean {
  return pathname.startsWith(ORGANOLEPTIK_ADMIN_BASE);
}

export function isPathAllowedForRole(pathname: string, role?: string | null): boolean {
  if (!canAccessAdminPanel(role)) return false;
  if (isFullAdminRole(role)) return true;
  return isOrganolepticEntryPath(pathname);
}

export function canModifyOrganolepticChecklist(
  role: string | undefined | null,
  checklist: { createdById: string | null },
  userId: string
): boolean {
  if (isFullAdminRole(role)) return true;
  if (isOrganolepticEntryRole(role)) {
    return checklist.createdById === userId;
  }
  return false;
}
