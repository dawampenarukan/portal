"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Feedback } from "@prisma/client";

const statusOptions = ["NEW", "IN_PROGRESS", "RESOLVED", "REJECTED"] as const;
const statusLabel: Record<string, string> = {
  NEW: "Baru",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  REJECTED: "Ditolak",
};

interface FeedbackDetailProps {
  feedbackId: string;
}

export function FeedbackDetail({ feedbackId }: FeedbackDetailProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
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
      const data = (await res.json()) as Feedback;
      setFeedback(data);
      setStatus(data.status);
      setAdminNotes(data.adminNotes ?? "");
    } finally {
      setFetching(false);
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

  return (
    <>
      <Button variant="ghost" size="sm" onClick={handleOpen}>
        Detail
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            {fetching || !feedback ? (
              <p className="text-sm text-muted-foreground">Memuat detail...</p>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold">{feedback.title}</h3>
                  <Badge>{statusLabel[feedback.status]}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feedback.name} · {feedback.email ?? "-"} · {feedback.phone ?? "-"}
                </p>
                <p className="mt-4 text-sm">{feedback.description}</p>

                {feedback.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {feedback.images.map((img) => (
                      <img
                        key={img}
                        src={img}
                        alt="Lampiran"
                        className="rounded-lg border object-cover"
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
                    <label className="mb-1 block text-sm font-medium">Catatan Admin</label>
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
        </div>
      )}
    </>
  );
}
