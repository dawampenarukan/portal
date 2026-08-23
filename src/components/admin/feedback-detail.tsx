"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageZoom } from "@/components/ui/image-zoom";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const statusOptions = ["NEW", "IN_PROGRESS", "RESOLVED", "REJECTED"] as const;
const statusLabel: Record<string, string> = {
  NEW: "Baru",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  REJECTED: "Ditolak",
};

/** Shape API feedback — tanpa import @prisma/client di client bundle. */
interface FeedbackDetailData {
  id: string;
  title: string;
  name: string;
  email: string | null;
  phone: string | null;
  schoolLocation: string | null;
  description: string;
  status: (typeof statusOptions)[number];
  adminNotes: string | null;
  images: string[];
  createdAt?: string;
}

interface FeedbackDetailProps {
  feedbackId: string;
  /** Elemen pembungkus yang bisa diklik untuk membuka detail. */
  as?: "tr" | "div";
  className?: string;
  children: React.ReactNode;
}

export function FeedbackDetail({
  feedbackId,
  as = "div",
  className,
  children,
}: FeedbackDetailProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackDetailData | null>(null);
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("NEW");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  async function handleOpen() {
    setOpen(true);
    if (feedback) return;

    setFetching(true);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}`);
      if (!res.ok) return;
      const data = (await res.json()) as FeedbackDetailData;
      setFeedback(data);
      setStatus(data.status);
      setAdminNotes(data.adminNotes ?? "");
    } finally {
      setFetching(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      void handleOpen();
    }
  }

  async function handleSave() {
    if (!feedback) return;
    setLoading(true);
    await fetch(`/api/feedback/${feedback.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  const Comp = as;

  return (
    <>
      <Comp
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role={as === "div" ? "button" : undefined}
        aria-label={`Lihat detail masukan ${feedbackId}`}
        className={cn("cursor-pointer", className)}
      >
        {children}
      </Comp>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {fetching || !feedback ? (
                <p className="text-sm text-muted-foreground">Memuat detail...</p>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold">{feedback.title}</h3>
                    <Badge>{statusLabel[feedback.status]}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feedback.name} · {feedback.schoolLocation?.trim() || "—"} ·{" "}
                    {feedback.email ?? "-"} · {feedback.phone ?? "-"}
                  </p>
                  <p className="mt-4 text-sm">{feedback.description}</p>

                  {feedback.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {feedback.images.map((img, index) => (
                        <ImageZoom
                          key={`${img}-${index}`}
                          src={img}
                          alt={`Lampiran ${index + 1}`}
                          thumbClassName="aspect-video w-full rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Status</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as typeof status)}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {statusLabel[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Catatan Admin
                      </label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Button onClick={handleSave} disabled={loading}>
                      {loading ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Tutup
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
