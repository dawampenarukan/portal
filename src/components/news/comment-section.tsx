"use client";

import { MessageSquare, Reply } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/lib/utils";

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  replies: {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  }[];
}

interface CommentSectionProps {
  comments: Comment[];
}

export function CommentSection({ comments }: CommentSectionProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  return (
    <section className="rounded-xl border bg-card p-6">
      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
        <MessageSquare className="h-5 w-5 text-primary" />
        Komentar ({comments.length})
      </h2>

      <form
        className="mb-8 space-y-3 rounded-lg border bg-muted/30 p-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <Input
          placeholder="Nama Anda"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          placeholder="Tulis komentar Anda..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button type="submit" disabled={!name.trim() || !content.trim()}>
          Kirim Komentar
        </Button>
      </form>

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b pb-6 last:border-b-0">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {comment.authorName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{comment.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed">{comment.content}</p>
                <button className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                  <Reply className="h-3 w-3" />
                  Balas
                </button>

                {comment.replies.length > 0 && (
                  <div className="mt-4 space-y-4 border-l-2 border-primary/20 pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{reply.authorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(reply.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
