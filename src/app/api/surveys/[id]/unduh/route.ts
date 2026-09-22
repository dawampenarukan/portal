import { requireAdmin, notFound, serverError } from "@/lib/api-auth";
import { buildSurveyExportExcel } from "@/lib/survey-export";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const exported = await buildSurveyExportExcel(id);
    if (!exported) return notFound("Survey tidak ditemukan");

    return new Response(new Uint8Array(exported.buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${exported.filename}"; filename*=UTF-8''${encodeURIComponent(exported.filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[survey:export]", err);
    return serverError("Gagal mengunduh hasil survey");
  }
}
