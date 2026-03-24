import { NextRequest, NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const url: string = (body.url ?? "").trim();
  const label: string = (body.label ?? "").trim();

  if (!url) {
    return NextResponse.json({ error: "URL requise" }, { status: 400 });
  }

  // Validation basique du format proxy
  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("socks4://") &&
    !url.startsWith("socks5://")
  ) {
    return NextResponse.json(
      { error: "Format invalide. Utilise http://, https://, socks4:// ou socks5://" },
      { status: 400 }
    );
  }

  try {
    const proxy = await prisma.proxy.create({
      data: { url, label: label || null },
    });
    return NextResponse.json(proxy, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Ce proxy existe déjà" },
      { status: 409 }
    );
  }
}
