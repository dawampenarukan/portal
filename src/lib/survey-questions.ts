import "server-only";

import { Prisma } from "@prisma/client";
import {
  ensureNpsQuestion,
  type SurveyQuestionInput,
} from "@/lib/survey-defaults";

type ExistingQuestion = {
  id: string;
  type: string;
  options: Prisma.JsonValue;
  question: string;
  order: number;
};

function optionsToDb(options: string[] | undefined): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (!options || options.length === 0) return Prisma.DbNull;
  return options;
}

/**
 * Sync pertanyaan survey tanpa wipe buta.
 * - id dikenal (milik survey ini) → update
 * - tanpa id / id asing → create (id asing diabaikan)
 * - id existing yang tidak dikirim → delete (hanya jika allowDelete)
 */
export async function syncSurveyQuestions(
  tx: Prisma.TransactionClient,
  surveyId: string,
  incoming: SurveyQuestionInput[],
  existing: ExistingQuestion[],
  opts: { allowDelete: boolean }
): Promise<void> {
  const normalized = ensureNpsQuestion(incoming);
  const existingById = new Map(existing.map((q) => [q.id, q]));
  const keepIds = new Set<string>();

  for (let i = 0; i < normalized.length; i++) {
    const q = normalized[i]!;
    const order = q.order ?? i;
    const data = {
      question: q.question.trim(),
      type: q.type,
      options: optionsToDb(q.options),
      order,
    };

    if (q.id && existingById.has(q.id)) {
      keepIds.add(q.id);
      await tx.surveyQuestion.updateMany({
        where: { id: q.id, surveyId },
        data,
      });
      continue;
    }

    const created = await tx.surveyQuestion.create({
      data: {
        surveyId,
        ...data,
      },
    });
    keepIds.add(created.id);
  }

  const toDelete = existing.filter((q) => !keepIds.has(q.id)).map((q) => q.id);
  if (toDelete.length === 0) return;

  if (!opts.allowDelete) {
    throw new Error("STRUCTURAL_DELETE_BLOCKED");
  }

  await tx.surveyQuestion.deleteMany({
    where: { id: { in: toDelete }, surveyId },
  });
}
