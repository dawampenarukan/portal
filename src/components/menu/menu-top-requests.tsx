"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { TopMenuRequestView } from "@/lib/types";

interface MenuTopRequestsProps {
  items: TopMenuRequestView[];
}

function TopRequestRow({
  item,
  rank,
  maxCount,
}: {
  item: TopMenuRequestView;
  rank: number;
  maxCount: number;
}) {
  const percent = Math.round((item.requestCount / maxCount) * 100);

  return (
    <Card className="charming-card shrink-0 border-0">
      <CardContent className="flex gap-3 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-2xl">
          {item.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">
                {rank}
              </span>
              <span className="font-extrabold">{item.name}</span>
            </div>
            <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-primary">
              📨 {item.requestCount}
            </span>
          </div>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          )}
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[#3cb88a] transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MenuTopRequests({ items }: MenuTopRequestsProps) {
  const maxCount = useMemo(
    () => Math.max(1, ...items.map((item) => item.requestCount)),
    [items]
  );

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada request menu. Jadilah yang pertama mengajukan menu impianmu!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Dua menu yang paling sering diminta untuk kategori ini.
      </p>
      <div className="space-y-3">
        {items.map((item, index) => (
          <TopRequestRow
            key={item.id}
            item={item}
            rank={index + 1}
            maxCount={maxCount}
          />
        ))}
      </div>
    </div>
  );
}
