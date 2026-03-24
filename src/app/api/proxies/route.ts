import { NextRequest, NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeProxyUrl } from "@/lib/proxy-utils";

export async function GET() {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const proxies = await prisma.proxy.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(proxies);
}

export async function POST(req: NextRequest) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await req.json();
  const raw: string = (body.url ?? "").trim();
  const label: string = (body.label ?? "").trim();

  if (!raw) {
    return NextResponse.json({ error: "URL requise" }, { status: 400 });
  }

  const normalized = normalizeProxyUrl(raw);
  if (!normalized) {
    return NextResponse.json(
      { error: "Format invalide. Exemples : 1.2.3.4:8080, 1.2.3.4:8080:pass, 1.2.3.4:8080:user:pass, http://user:pass@host:port" },
      { status: 400 }
    );
  }

  try {
    const proxy = await prisma.proxy.create({
      data: { url: normalized, label: label || null },
    });
    return NextResponse.json(proxy, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Ce proxy existe déjà" },
      { status: 409 }
    );
  }
}
