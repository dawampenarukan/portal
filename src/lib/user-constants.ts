export const USER_ROLE_SUPER_ADMIN = "SUPER_ADMIN";
export const USER_ROLE_ORGANOLEPTIC_ENTRY = "ORGANOLEPTIC_ENTRY";

export const MANAGEABLE_USER_ROLES = [
  USER_ROLE_SUPER_ADMIN,
  USER_ROLE_ORGANOLEPTIC_ENTRY,
] as const;

export type ManageableUserRole = (typeof MANAGEABLE_USER_ROLES)[number];

export const MANAGEABLE_USER_ROLE_LABELS: Record<ManageableUserRole, string> = {
  [USER_ROLE_SUPER_ADMIN]: "Admin",
  [USER_ROLE_ORGANOLEPTIC_ENTRY]: "Entri Organoleptik",
};

export function isManageableUserRole(role: string): role is ManageableUserRole {
  return MANAGEABLE_USER_ROLES.includes(role as ManageableUserRole);
}
