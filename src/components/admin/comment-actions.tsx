"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentActionsProps {
  commentId: string;
  isApproved: boolean;
}

export function CommentActions({ commentId, isApproved }: CommentActionsProps) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggleApproval() {
    setLoading(true);
    await fetch(`/api/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: !isApproved }),
    });
    setLoading(false);
    router.refresh();
  }

  async function submitReply() {
    if (!reply.trim()) return;
    setLoading(true);
    await fetch(`/api/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    });
    setReply("");
    setShowReply(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={toggleApproval} disabled={loading}>
          {isApproved ? "Sembunyikan" : "Setujui"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowReply(!showReply)}>
          Balas
        </Button>
      </div>
      {showReply && (
        <div className="flex gap-2">
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} className="flex-1" />
          <Button size="sm" onClick={submitReply} disabled={loading}>
            Kirim
          </Button>
        </div>
      )}
    </div>
  );
}
