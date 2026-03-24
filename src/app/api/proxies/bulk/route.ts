import { NextRequest, NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_PROTOCOLS = ["http://", "https://", "socks4://", "socks5://"];

export async function POST(req: NextRequest) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await req.json();
  const urls: string[] = (body.urls ?? [])
    .map((u: string) => u.trim())
    .filter((u: string) => u.length > 0);

  if (!urls.length) {
    return NextResponse.json({ error: "Aucune URL fournie" }, { status: 400 });
  }

  const valid = urls.filter((u) =>
    VALID_PROTOCOLS.some((p) => u.startsWith(p))
  );

  if (!valid.length) {
    return NextResponse.json(
      { error: "Aucune URL valide" },
      { status: 400 }
    );
  }

  // createMany + skipDuplicates pour ignorer les doublons silencieusement
  const result = await prisma.proxy.createMany({
    data: valid.map((url) => ({ url })),
    skipDuplicates: true,
  });

  // Retourne les proxies créés pour mettre à jour l'UI
  const created = await prisma.proxy.findMany({
    where: { url: { in: valid } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ imported: result.count, proxies: created });
}
