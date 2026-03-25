import { NextRequest, NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkBacklink } from "@/lib/checkers/backlink";
import { checkIndexation } from "@/lib/checkers/indexation";

export async function POST(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const type: "backlink" | "indexation" | "all" = body.type ?? "all";

  const articles = await prisma.article.findMany({
    where: { campaignId: params.campaignId },
    select: { id: true },
  });

  if (articles.length === 0) {
    return NextResponse.json({ message: "Aucun article", count: 0 });
  }

  const ids = articles.map((a) => a.id);

  // Batches de 3 en arrière-plan
  (async () => {
    const BATCH = 3;
    for (let i = 0; i < ids.length; i += BATCH) {
      const batch = ids.slice(i, i + BATCH);
      await Promise.all(
        batch.map((id) => {
          const tasks =
            type === "backlink"    ? [checkBacklink(id)] :
            type === "indexation"  ? [checkIndexation(id)] :
                                     [checkBacklink(id), checkIndexation(id)];
          return Promise.all(tasks).catch(console.error);
        })
      );
      if (i + BATCH < ids.length) await new Promise((r) => setTimeout(r, 2_000));
    }
  })().catch(console.error);

  return NextResponse.json({ message: `Vérification lancée pour ${ids.length} backlink(s)`, count: ids.length });
}
