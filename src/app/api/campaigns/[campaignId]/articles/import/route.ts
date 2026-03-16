import { NextRequest, NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { articleCreateSchema } from "@/lib/validations/article";
import Papa from "papaparse";

export async function POST(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "Aucun fichier fourni" },
      { status: 400 }
    );
  }

  const text = await file.text();
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (data.length > 500) {
    return NextResponse.json(
      { error: "Le fichier ne peut pas contenir plus de 500 lignes" },
      { status: 400 }
    );
  }

  const validArticles: {
    campaignId: string;
    articleUrl: string;
    targetUrl: string;
    anchorText: string;
    manualStatus: "PENDING" | "SENT" | "CONFIRMED" | "DELETED";
  }[] = [];
  const importErrors: { row: number; message: string }[] = [];

  data.forEach((row, index) => {
    const result = articleCreateSchema.safeParse({
      articleUrl: row.article_url || row.articleUrl || row.url_article,
      targetUrl: row.target_url || row.targetUrl || row.url_cible,
      anchorText: row.anchor_text || row.anchorText || row.ancre || "",
      manualStatus:
        (row.status || row.manualStatus || "PENDING").toUpperCase(),
    });

    if (result.success) {
      validArticles.push({
        campaignId: params.campaignId,
        ...result.data,
      });
    } else {
      importErrors.push({
        row: index + 2, // +2 for header row + 0-index
        message: result.error.issues.map((i) => i.message).join(", "),
      });
    }
  });

  let imported = 0;
  if (validArticles.length > 0) {
    const result = await prisma.article.createMany({
      data: validArticles,
      skipDuplicates: true,
    });
    imported = result.count;
  }

  return NextResponse.json({
    imported,
    total: data.length,
    errors: importErrors,
  });
}
