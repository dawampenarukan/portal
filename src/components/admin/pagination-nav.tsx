import Link from "next/link";
import { totalPages } from "@/lib/pagination";

interface PaginationNavProps {
  basePath: string;
  page: number;
  total: number;
}

export function PaginationNav({ basePath, page, total }: PaginationNavProps) {
  const pages = totalPages(total);
  if (pages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < pages ? page + 1 : null;

  return (
    <div className="flex items-center justify-between border-t pt-4 text-sm">
      <p className="text-muted-foreground">
        Halaman {page} dari {pages} · {total} item
      </p>
      <div className="flex gap-2">
        {prev ? (
          <Link
            href={`${basePath}?page=${prev}`}
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            ← Sebelumnya
          </Link>
        ) : (
          <span className="rounded-md border px-3 py-1.5 text-muted-foreground opacity-50">
            ← Sebelumnya
          </span>
        )}
        {next ? (
          <Link
            href={`${basePath}?page=${next}`}
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Selanjutnya →
          </Link>
        ) : (
          <span className="rounded-md border px-3 py-1.5 text-muted-foreground opacity-50">
            Selanjutnya →
          </span>
        )}
      </div>
    </div>
  );
}
