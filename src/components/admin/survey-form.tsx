"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SurveyView } from "@/lib/types";

interface QuestionDraft {
  question: string;
  type: string;
  options: string;
  order: number;
}

interface SurveyFormProps {
  survey?: SurveyView;
}

export function SurveyForm({ survey }: SurveyFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(survey?.title ?? "");
  const [description, setDescription] = useState(survey?.description ?? "");
  const [isActive, setIsActive] = useState(survey?.isActive ?? false);
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    survey?.questions.map((q) => ({
      question: q.question,
      type: q.type,
      options: (q.options ?? []).join(", "),
      order: q.order,
    })) ?? [{ question: "", type: "rating", options: "", order: 0 }]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addQuestion() {
    setQuestions([...questions, { question: "", type: "rating", options: "", order: questions.length }]);
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, field: keyof QuestionDraft, value: string) {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      title,
      description,
      isActive,
      questions: questions
        .filter((q) => q.question.trim())
        .map((q, i) => ({
          question: q.question,
          type: q.type,
          options: q.options ? q.options.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
          order: i,
        })),
    };

    const url = survey ? `/api/surveys/${survey.id}` : "/api/surveys";
    const method = survey ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan");
      return;
    }

    router.push("/admin/survey");
    router.refresh();
  }

  async function handlePublish() {
    if (!survey) return;
    setSubmitting(true);
    await fetch(`/api/surveys/${survey.id}/publish`, { method: "POST" });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Judul Survey *</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Deskripsi</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Aktifkan survey (bisa lebih dari satu survey aktif)
      </label>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Pertanyaan</h3>
          <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
        {questions.map((q, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Pertanyaan {i + 1}</span>
              {questions.length > 1 && (
                <Button type="button" size="sm" variant="ghost" onClick={() => removeQuestion(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Input
              placeholder="Teks pertanyaan"
              value={q.question}
              onChange={(e) => updateQuestion(i, "question", e.target.value)}
            />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={q.type}
              onChange={(e) => updateQuestion(i, "type", e.target.value)}
            >
              <option value="rating">Rating (1-5)</option>
              <option value="nps">NPS (0-10)</option>
              <option value="multiple_choice">Pilihan Ganda</option>
              <option value="text">Teks Bebas</option>
            </select>
            {q.type === "multiple_choice" && (
              <Input
                placeholder="Opsi, pisahkan dengan koma"
                value={q.options}
                onChange={(e) => updateQuestion(i, "options", e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : survey ? "Perbarui" : "Simpan"}
        </Button>
        {survey && (
          <Button type="button" variant="secondary" onClick={handlePublish} disabled={submitting}>
            Publikasikan ke Beranda
          </Button>
        )}
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
      </div>
    </form>
  );
}
