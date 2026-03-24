import { NextRequest, NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeProxyUrl } from "@/lib/proxy-utils";

export async function POST(req: NextRequest) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await req.json();
  const rawUrls: string[] = (body.urls ?? [])
    .map((u: string) => u.trim())
    .filter((u: string) => u.length > 0);

  if (!rawUrls.length) {
    return NextResponse.json({ error: "Aucune URL fournie" }, { status: 400 });
  }

  // Normalise et filtre les invalides
  const normalized = rawUrls
    .map((u) => normalizeProxyUrl(u))
    .filter((u): u is string => u !== null);

  if (!normalized.length) {
    return NextResponse.json({ error: "Aucune URL valide" }, { status: 400 });
  }

  const result = await prisma.proxy.createMany({
    data: normalized.map((url) => ({ url })),
    skipDuplicates: true,
  });

  const created = await prisma.proxy.findMany({
    where: { url: { in: normalized } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ imported: result.count, proxies: created });
}
