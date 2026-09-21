"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_NPS_QUESTION,
  DEFAULT_RESPONDENT_TARGET,
  ensureNpsQuestion,
  optionsToEditorText,
  parseOptionsFromEditor,
  SURVEY_CHOICE_TYPES,
  SURVEY_QUESTION_TYPE_LABELS,
  validateSurveyQuestionDraft,
} from "@/lib/survey-defaults";
import type { SurveyView } from "@/lib/types";

interface QuestionDraft {
  /** Stable React key (id pertanyaan atau uuid lokal). */
  key: string;
  id?: string;
  question: string;
  type: string;
  options: string;
  order: number;
}

interface SurveyFormProps {
  survey?: SurveyView;
}

function draftKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildQuestionDrafts(survey?: SurveyView): QuestionDraft[] {
  const ratingQuestions =
    survey?.questions
      .filter((q) => q.type !== "nps")
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((q) => ({
        key: q.id,
        id: q.id,
        question: q.question,
        type: q.type,
        options: optionsToEditorText(q.options),
        order: q.order,
      })) ?? [];

  return ratingQuestions.length > 0
    ? ratingQuestions
    : [{ key: draftKey(), question: "", type: "rating", options: "", order: 0 }];
}

export function SurveyForm({ survey }: SurveyFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(survey?.title ?? "");
  const [description, setDescription] = useState(survey?.description ?? "");
  const [respondentTarget, setRespondentTarget] = useState(
    String(survey?.respondentTarget ?? DEFAULT_RESPONDENT_TARGET)
  );
  const [isActive, setIsActive] = useState(survey?.isActive ?? false);
  const [npsQuestion, setNpsQuestion] = useState(
    survey?.questions.find((q) => q.type === "nps")?.question ?? DEFAULT_NPS_QUESTION
  );
  const [npsQuestionId] = useState(
    () => survey?.questions.find((q) => q.type === "nps")?.id
  );
  const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
    buildQuestionDrafts(survey)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [forceStructuralEdit, setForceStructuralEdit] = useState(false);
  const [message, setMessage] = useState("");

  const hasResponses = (survey?.responseCount ?? 0) > 0;

  function addQuestion() {
    setQuestions([
      ...questions,
      {
        key: draftKey(),
        question: "",
        type: "rating",
        options: "",
        order: questions.length,
      },
    ]);
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= questions.length) return;
    const copy = [...questions];
    const tmp = copy[index]!;
    copy[index] = copy[next]!;
    copy[next] = tmp;
    setQuestions(copy);
  }

  function updateQuestion(index: number, field: keyof QuestionDraft, value: string) {
    setQuestions(
      questions.map((q, i) => {
        if (i !== index) return q;
        if (field === "type" && !SURVEY_CHOICE_TYPES.has(value)) {
          return { ...q, type: value, options: "" };
        }
        return { ...q, [field]: value };
      })
    );
  }

  function optionCount(raw: string): number {
    return parseOptionsFromEditor(raw).length;
  }

  function buildPayload(force: boolean) {
    const targetValue = parseInt(respondentTarget, 10);
    const ratingQuestions = questions.map((q, i) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: SURVEY_CHOICE_TYPES.has(q.type)
        ? parseOptionsFromEditor(q.options)
        : undefined,
      order: i,
    }));

    return {
      title,
      description,
      isActive,
      respondentTarget: targetValue,
      forceStructuralEdit: force,
      questions: ensureNpsQuestion(
        [
          ...ratingQuestions,
          {
            id: npsQuestionId,
            question: npsQuestion,
            type: "nps",
            order: ratingQuestions.length,
          },
        ],
        npsQuestion
      ),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    const targetValue = parseInt(respondentTarget, 10);
    if (!Number.isFinite(targetValue) || targetValue < 1) {
      setSubmitting(false);
      setError("Target responden minimal 1");
      return;
    }

    if (questions.some((q) => !q.question.trim())) {
      setSubmitting(false);
      setError("Isi teks semua pertanyaan, atau hapus yang masih kosong.");
      return;
    }

    for (const q of questions) {
      if (SURVEY_CHOICE_TYPES.has(q.type) && optionCount(q.options) < 2) {
        setSubmitting(false);
        setError(
          `Pertanyaan “${q.question.trim()}” membutuhkan minimal 2 opsi (satu per baris).`
        );
        return;
      }
    }

    const draftError = validateSurveyQuestionDraft(buildPayload(false).questions);
    if (draftError) {
      setSubmitting(false);
      setError(draftError);
      return;
    }

    const url = survey ? `/api/surveys/${survey.id}` : "/api/surveys";
    const method = survey ? "PATCH" : "POST";

    async function postOnce(force: boolean) {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(force)),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      return { res, data };
    }

    try {
      let { res, data } = await postOnce(forceStructuralEdit);

      if (
        res.status === 409 &&
        data.code === "STRUCTURAL_EDIT_REQUIRED" &&
        !forceStructuralEdit
      ) {
        const ok = window.confirm(
          `${data.error ?? "Edit struktural memerlukan konfirmasi."}\n\nLanjutkan simpan? Jawaban pada pertanyaan yang dihapus/diubah tipenya dapat hilang.`
        );
        if (!ok) {
          setForceStructuralEdit(false);
          setError(
            "Simpan dibatalkan. Ubah hanya teks pertanyaan/metadata, atau konfirmasi edit struktural."
          );
          return;
        }
        setForceStructuralEdit(true);
        ({ res, data } = await postOnce(true));
      }

      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan");
        return;
      }

      router.push("/admin/survey");
      router.refresh();
    } catch {
      setError("Gagal menyimpan. Periksa koneksi lalu coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublish() {
    if (!survey) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/surveys/${survey.id}/publish`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Gagal menampilkan di portal");
        return;
      }
      setMessage("Hasil survey ditampilkan di portal.");
      router.refresh();
    } catch {
      setError("Gagal menampilkan di portal. Periksa koneksi lalu coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="max-w-3xl space-y-6">
      {hasResponses ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          Survey ini sudah punya <strong>{survey!.responseCount}</strong> jawaban.
          Mengubah tipe/opsi, menambah, atau menghapus pertanyaan dapat menghapus jawaban
          terkait. Mengubah judul, deskripsi, target, status aktif, atau teks pertanyaan saja
          aman.
        </div>
      ) : null}

      <div>
        <label className="mb-1.5 block text-sm font-medium">Judul Survey *</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Deskripsi</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Target Responden *</label>
        <Input
          type="number"
          min={1}
          value={respondentTarget}
          onChange={(e) => setRespondentTarget(e.target.value)}
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Dipakai untuk menghitung persentase target tercapai di dashboard survey.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Aktifkan survey (bisa lebih dari satu survey aktif)
      </label>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Pertanyaan Kepuasan</h3>
          <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
        {questions.map((q, i) => (
          <div key={q.key} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Pertanyaan {i + 1}</span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={i === 0}
                  onClick={() => moveQuestion(i, -1)}
                  aria-label="Naikkan urutan"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={i === questions.length - 1}
                  onClick={() => moveQuestion(i, 1)}
                  aria-label="Turunkan urutan"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                {questions.length > 1 && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeQuestion(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Input
              placeholder="Teks pertanyaan"
              value={q.question}
              onChange={(e) => updateQuestion(i, "question", e.target.value)}
              required
            />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={q.type}
              onChange={(e) => updateQuestion(i, "type", e.target.value)}
              aria-label={`Tipe pertanyaan ${i + 1}`}
            >
              <option value="rating">{SURVEY_QUESTION_TYPE_LABELS.rating}</option>
              <option value="multiple_choice">
                {SURVEY_QUESTION_TYPE_LABELS.multiple_choice}
              </option>
              <option value="checkbox">{SURVEY_QUESTION_TYPE_LABELS.checkbox}</option>
              <option value="text">{SURVEY_QUESTION_TYPE_LABELS.text}</option>
            </select>
            {SURVEY_CHOICE_TYPES.has(q.type) && (
              <div>
                <Textarea
                  rows={4}
                  placeholder={"Satu opsi per baris\nContoh:\nSayur sop\nCapcay\nTumis kangkung"}
                  value={q.options}
                  onChange={(e) => updateQuestion(i, "options", e.target.value)}
                  aria-label={`Opsi pertanyaan ${i + 1}`}
                />
                <p
                  className={
                    optionCount(q.options) < 2
                      ? "mt-1 text-xs text-destructive"
                      : "mt-1 text-xs text-muted-foreground"
                  }
                >
                  {optionCount(q.options) < 2
                    ? `Minimal 2 opsi (saat ini ${optionCount(q.options)}). Satu opsi per baris.`
                    : `${optionCount(q.options)} opsi siap dipakai. Satu opsi per baris${
                        q.type === "checkbox"
                          ? " — responden boleh mencentang beberapa."
                          : "."
                      }`}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div>
          <h3 className="font-semibold">Skor Bahagia (NPS) — Wajib</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Pertanyaan ini selalu ada di setiap survey untuk menghitung skor bahagia (skala 0–10).
          </p>
        </div>
        <Input
          value={npsQuestion}
          onChange={(e) => setNpsQuestion(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Tipe: {SURVEY_QUESTION_TYPE_LABELS.nps}, tidak dapat dihapus.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-primary" role="status">
          {message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : survey ? "Perbarui" : "Simpan"}
        </Button>
        {survey && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handlePublish()}
            disabled={submitting}
          >
            Tampilkan di Portal
          </Button>
        )}
        {survey?.isActive ? (
          <Link
            href={`/survey/${survey.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-primary/30 bg-background px-5 text-sm font-bold hover:bg-accent"
          >
            <ExternalLink className="h-4 w-4" />
            Pratinjau isi
          </Link>
        ) : null}
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
      </div>
    </form>
  );
}
