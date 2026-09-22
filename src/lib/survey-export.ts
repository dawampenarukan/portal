import "server-only";

import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import {
  parseAnswerValues,
  SURVEY_QUESTION_TYPE_LABELS,
  type SurveyQuestionType,
} from "@/lib/survey-defaults";
import { aggregateSurveyResultsFromLoaded } from "@/lib/survey-aggregation";
import type { SurveyDataView } from "@/lib/types";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F6B4A" },
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 11,
};
const TITLE_FONT: Partial<ExcelJS.Font> = { bold: true, size: 14, color: { argb: "FF1F6B4A" } };
const SECTION_FONT: Partial<ExcelJS.Font> = { bold: true, size: 12 };

function slugFilePart(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "survey";
}

export function surveyExportFilename(title: string, surveyId: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `Hasil-Survey-${slugFilePart(title)}-${surveyId.slice(0, 8)}-${stamp}.xlsx`;
}

function questionTypeLabel(type: string): string {
  return SURVEY_QUESTION_TYPE_LABELS[type as SurveyQuestionType] ?? type;
}

function formatAnswerForExcel(raw: string, type: string): string {
  if (type === "checkbox") {
    return parseAnswerValues(raw).join("; ");
  }
  return raw;
}

function formatResponseDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function styleHeaderRow(row: ExcelJS.Row, columnCount: number) {
  for (let col = 1; col <= columnCount; col++) {
    const cell = row.getCell(col);
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", wrapText: true };
  }
  row.height = 22;
}

function autosizeColumns(sheet: ExcelJS.Worksheet, min = 12, max = 42) {
  const columnCount = sheet.columnCount || 1;
  for (let i = 1; i <= columnCount; i++) {
    const column = sheet.getColumn(i);
    let longest = min;
    column.eachCell({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > longest) longest = len;
    });
    column.width = Math.min(max, Math.max(min, longest + 2));
  }
}

function addSimpleTable(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  headers: string[],
  rows: (string | number)[][]
): number {
  const headerRow = sheet.getRow(startRow);
  headers.forEach((h, i) => {
    headerRow.getCell(i + 1).value = h;
  });
  styleHeaderRow(headerRow, headers.length);

  let rowIndex = startRow + 1;
  for (const values of rows) {
    const row = sheet.getRow(rowIndex);
    values.forEach((value, i) => {
      row.getCell(i + 1).value = value;
      row.getCell(i + 1).alignment = { vertical: "middle", wrapText: true };
    });
    rowIndex += 1;
  }
  return rowIndex;
}

function buildRingkasanSheet(
  workbook: ExcelJS.Workbook,
  survey: { title: string; description: string | null },
  chart: SurveyDataView
) {
  const sheet = workbook.addWorksheet("Ringkasan", {
    views: [{ showGridLines: false }],
  });

  sheet.mergeCells("A1:B1");
  sheet.getCell("A1").value = "Hasil Survey";
  sheet.getCell("A1").font = TITLE_FONT;

  sheet.mergeCells("A2:B2");
  sheet.getCell("A2").value = survey.title;
  sheet.getCell("A2").font = { bold: true, size: 12 };

  if (survey.description) {
    sheet.mergeCells("A3:B3");
    sheet.getCell("A3").value = survey.description;
    sheet.getCell("A3").alignment = { wrapText: true };
  }

  const metricStart = survey.description ? 5 : 4;
  sheet.getCell(`A${metricStart}`).value = "Indikator utama";
  sheet.getCell(`A${metricStart}`).font = SECTION_FONT;

  addSimpleTable(sheet, metricStart + 1, ["Indikator", "Nilai"], [
    ["Jumlah yang menjawab", chart.respondents],
    ["Target responden", chart.respondentTarget ?? 0],
    ["Target tercapai", `${chart.target}%`],
    ["Skor kepuasan", `${chart.satisfactionScore} dari 5`],
    ["Skor bahagia (NPS)", chart.npsScore],
  ]);

  sheet.getCell("A1").note = "File ini dibuat untuk dibaca di Microsoft Excel / Google Sheets.";
  autosizeColumns(sheet, 18, 48);
}

function buildAspekSheet(workbook: ExcelJS.Workbook, chart: SurveyDataView) {
  if (chart.aspects.length === 0) return;
  const sheet = workbook.addWorksheet("Aspek Rating");
  sheet.getCell("A1").value = "Rata-rata skor per pertanyaan rating (skala 1–5)";
  sheet.getCell("A1").font = SECTION_FONT;
  sheet.mergeCells("A1:B1");
  addSimpleTable(
    sheet,
    3,
    ["Pertanyaan", "Rata-rata skor"],
    chart.aspects.map((a) => [a.name, a.score])
  );
  autosizeColumns(sheet, 16, 50);
}

function buildTrenSheet(workbook: ExcelJS.Workbook, chart: SurveyDataView) {
  if (chart.trend.length === 0) return;
  const sheet = workbook.addWorksheet("Tren Bulanan");
  sheet.getCell("A1").value = "Tren kepuasan bulanan";
  sheet.getCell("A1").font = SECTION_FONT;
  sheet.mergeCells("A1:B1");
  addSimpleTable(
    sheet,
    3,
    ["Bulan", "Skor kepuasan"],
    chart.trend.map((t) => [t.month, t.score])
  );
  autosizeColumns(sheet, 14, 24);
}

function buildPilihanSheet(workbook: ExcelJS.Workbook, chart: SurveyDataView) {
  const blocks = chart.choiceBreakdown ?? [];
  if (blocks.length === 0) return;

  const sheet = workbook.addWorksheet("Hasil Pilihan");
  sheet.getCell("A1").value = "Hasil pertanyaan pilihan (tunggal & multi-pilih)";
  sheet.getCell("A1").font = SECTION_FONT;
  sheet.mergeCells("A1:D1");

  let row = 3;
  for (const block of blocks) {
    sheet.mergeCells(`A${row}:D${row}`);
    sheet.getCell(`A${row}`).value = block.question;
    sheet.getCell(`A${row}`).font = { bold: true };
    row += 1;

    sheet.getCell(`A${row}`).value =
      block.type === "checkbox"
        ? "Tipe: boleh pilih lebih dari satu"
        : "Tipe: pilih satu";
    sheet.getCell(`A${row}`).font = { italic: true, size: 10, color: { argb: "FF666666" } };
    row += 1;

    row = addSimpleTable(
      sheet,
      row,
      ["Pilihan", "Jumlah", "Persentase"],
      block.options.map((opt) => [opt.label, opt.count, `${opt.percent}%`])
    );
    row += 2;
  }
  autosizeColumns(sheet, 14, 48);
}

function buildResponsSheet(
  workbook: ExcelJS.Workbook,
  questions: { id: string; question: string; type: string }[],
  responses: {
    respondentName: string | null;
    respondentAge: number | null;
    respondentSchool: string | null;
    createdAt: Date;
    answers: { questionId: string; value: string }[];
  }[]
) {
  const sheet = workbook.addWorksheet("Data Responden");
  const headers = [
    "No",
    "Nama",
    "Umur",
    "Nama Sekolah/Posyandu",
    "Tanggal mengisi",
    ...questions.map((q) => q.question),
  ];

  const headerRow = sheet.getRow(1);
  headers.forEach((h, i) => {
    headerRow.getCell(i + 1).value = h;
  });
  styleHeaderRow(headerRow, headers.length);
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };

  const filled = responses.filter((r) => r.answers.length > 0);
  filled.forEach((response, index) => {
    const byQuestion = new Map(response.answers.map((a) => [a.questionId, a.value]));
    const row = sheet.getRow(index + 2);
    const values: (string | number)[] = [
      index + 1,
      response.respondentName ?? "",
      response.respondentAge ?? "",
      response.respondentSchool ?? "",
      formatResponseDate(response.createdAt),
      ...questions.map((q) => formatAnswerForExcel(byQuestion.get(q.id) ?? "", q.type)),
    ];
    values.forEach((value, i) => {
      row.getCell(i + 1).value = value;
      row.getCell(i + 1).alignment = { vertical: "middle", wrapText: true };
    });
  });

  // Baris petunjuk tipe di baris 2 jika ada data? Better: second header note row would break filter.
  // Add a legend sheet note instead via column comment on first question headers.
  questions.forEach((q, i) => {
    sheet.getRow(1).getCell(6 + i).note = `Tipe: ${questionTypeLabel(q.type)}`;
  });

  autosizeColumns(sheet, 12, 40);
  if (filled.length === 0) {
    sheet.getCell("A3").value = "Belum ada responden yang mengisi survey ini.";
  }
}

/**
 * Excel (.xlsx) siap dibaca pengguna:
 * Ringkasan, Aspek Rating, Tren, Hasil Pilihan, Data Responden.
 */
export async function buildSurveyExportExcel(surveyId: string): Promise<{
  filename: string;
  buffer: Buffer;
} | null> {
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      questions: { orderBy: { order: "asc" } },
      responses: {
        include: { answers: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!survey) return null;

  const chart = aggregateSurveyResultsFromLoaded(survey);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Portal SPPG Penarukan 2";
  workbook.created = new Date();
  workbook.modified = new Date();

  buildRingkasanSheet(workbook, survey, chart);
  buildAspekSheet(workbook, chart);
  buildTrenSheet(workbook, chart);
  buildPilihanSheet(workbook, chart);
  buildResponsSheet(workbook, survey.questions, survey.responses);

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    filename: surveyExportFilename(survey.title, survey.id),
    buffer,
  };
}
