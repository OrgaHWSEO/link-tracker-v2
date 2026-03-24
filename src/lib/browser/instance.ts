/**
 * Singleton Playwright browser avec stealth plugin.
 * Expose aussi getProxyConfig() pour utiliser un proxy actif aléatoire.
 */
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, BrowserContextOptions } from "playwright";
import { prisma } from "@/lib/prisma";

// Active le stealth une seule fois
chromium.use(StealthPlugin());

let browser: Browser | null = null;

/** Viewports courants pour paraître humain */
const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
];

export function randomViewport() {
  return VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];
}

export async function getBrowser(): Promise<Browser> {
  if (browser?.isConnected()) return browser;

  browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--no-first-run",
      "--disable-gpu",
    ],
  });

  const cleanup = () => {
    browser?.close().catch(() => {});
    browser = null;
  };
  process.once("exit", cleanup);
  process.once("SIGINT", cleanup);
  process.once("SIGTERM", cleanup);

  return browser;
}

/**
 * Retourne la config proxy Playwright pour un proxy actif pris aléatoirement.
 * Retourne undefined si aucun proxy actif n'est configuré (utilise l'IP serveur).
 */
export async function getProxyConfig(): Promise<
  BrowserContextOptions["proxy"] | undefined
> {
  const activeProxies = await prisma.proxy.findMany({
    where: { isActive: true },
    select: { url: true },
  });

  if (activeProxies.length === 0) return undefined;

  // Sélection aléatoire parmi les proxies actifs
  const picked =
    activeProxies[Math.floor(Math.random() * activeProxies.length)];

  try {
    const parsed = new URL(picked.url);
    const server = `${parsed.protocol}//${parsed.hostname}:${parsed.port}`;
    return {
      server,
      ...(parsed.username ? { username: parsed.username } : {}),
      ...(parsed.password
        ? { password: decodeURIComponent(parsed.password) }
        : {}),
    };
  } catch {
    // URL malformée → pas de proxy pour cette requête
    return undefined;
  }
}
