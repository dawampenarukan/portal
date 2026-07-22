"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SurveyView } from "@/lib/types";

interface PublicSurveyFormProps {
  survey: SurveyView;
}

export function PublicSurveyForm({ survey }: PublicSurveyFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/surveys/${survey.id}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        respondentName: name,
        answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
      }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal mengirim");
      return;
    }

    setSubmitted(true);
    router.refresh();
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl">🎉</span>
        <h2 className="mt-4 text-2xl font-bold text-primary">Terima Kasih!</h2>
        <p className="mt-2 text-muted-foreground">Jawaban survey kamu sudah kami terima.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Nama (opsional)</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" />
      </div>

      {survey.questions.map((q, i) => (
        <div key={q.id} className="rounded-lg border p-4">
          <p className="font-medium">
            {i + 1}. {q.question}
          </p>
          <div className="mt-3">
            {q.type === "rating" && (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAnswer(q.id, String(n))}
                    className={`inline-flex h-11 min-w-11 items-center justify-center rounded-full border text-sm font-medium ${
                      answers[q.id] === String(n) ? "bg-primary text-white" : ""
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
            {q.type === "nps" && (
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
                {Array.from({ length: 11 }, (_, n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAnswer(q.id, String(n))}
                    className={`inline-flex h-11 min-h-11 w-full items-center justify-center rounded-lg border text-sm font-medium ${
                      answers[q.id] === String(n) ? "bg-primary text-white" : ""
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
            {q.type === "multiple_choice" && q.options && (
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswer(q.id, opt)}
                      className="h-4 w-4 shrink-0"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {q.type === "text" && (
              <Textarea
                rows={3}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              />
            )}
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Mengirim..." : "Kirim Jawaban"}
      </Button>
    </form>
  );
}
