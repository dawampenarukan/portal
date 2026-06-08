export const ADMIN_PAGE_SIZE = 30;

export function parsePage(value: string | undefined): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function pageOffset(page: number): number {
  return (page - 1) * ADMIN_PAGE_SIZE;
}

export function totalPages(total: number): number {
  return Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
}
