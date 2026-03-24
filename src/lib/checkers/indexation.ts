/**
 * Vérification d'indexation Google via Playwright.
 *
 * Logique : "site:URL_DE_L_ARTICLE" sur Google.fr
 *  - Des résultats existent → INDEXED
 *  - "Aucun résultat" détecté → NOT_INDEXED
 *  - CAPTCHA / ban IP / erreur réseau → UNKNOWN
 *
 * Anti-ban :
 *  - Stealth plugin (fingerprint réaliste)
 *  - File d'attente : 1 requête à la fois + délai 6-11 s aléatoire
 *  - Gestion automatique page consentement RGPD Google
 */
import { prisma } from "@/lib/prisma";
import { getBrowser, randomViewport } from "@/lib/browser/instance";
import { acquireGoogleSlot } from "@/lib/browser/google-queue";

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** Accepte la page de consentement RGPD Google si elle apparaît. */
async function handleConsentPage(page: import("playwright").Page): Promise<void> {
  const url = page.url();
  if (!url.includes("consent.google") && !url.includes("accounts.google")) {
    return; // Pas de page de consentement
  }

  // Google peut présenter plusieurs variantes du bouton d'acceptation
  const candidates = [
    'button:has-text("Tout accepter")',
    'button:has-text("Accepter tout")',
    'button:has-text("Accept all")',
    'button:has-text("J\'accepte")',
    'button:has-text("I agree")',
    "[id='L2AGLb']",           // ID historique du bouton Google
    "form[action*='save'] button[type='submit']",
    "form button[value='1']",
  ];

  for (const sel of candidates) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1_500 })) {
        await btn.click();
        // Attend le retour sur la page de recherche
        await page.waitForURL(/google\.(fr|com)\/search/, { timeout: 8_000 });
        await sleep(600 + Math.random() * 600);
        return;
      }
    } catch {
      // Ce sélecteur n'a pas fonctionné → on essaie le suivant
    }
  }
}

export async function checkIndexation(articleId: string): Promise<void> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { articleUrl: true },
  });
  if (!article) return;

  // Attend son tour (1 requête Google à la fois, 6-11 s entre chaque)
  const release = await acquireGoogleSlot();

  let status: "INDEXED" | "NOT_INDEXED" | "UNKNOWN" = "UNKNOWN";

  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: randomViewport(),
    locale: "fr-FR",
    extraHTTPHeaders: {
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    },
  });
  const page = await context.newPage();

  try {
    const query = encodeURIComponent(`site:${article.articleUrl}`);
    await page.goto(
      `https://www.google.fr/search?q=${query}&hl=fr&num=5`,
      { waitUntil: "domcontentloaded", timeout: 25_000 }
    );

    // ── Gestion page de consentement RGPD ─────────────────────────
    await handleConsentPage(page);

    // ── Détection ban IP / page Sorry ─────────────────────────────
    const currentUrl = page.url();
    if (
      currentUrl.includes("/sorry/") ||
      currentUrl.includes("sorry.google")
    ) {
      status = "UNKNOWN"; // IP bloquée, on ne peut pas conclure
      return;
    }

    // ── Détection CAPTCHA (recaptcha iframe ou formulaire /sorry) ──
    const hasCaptcha =
      (await page
        .locator('iframe[src*="recaptcha"], form[action*="/sorry/"]')
        .count()) > 0;
    if (hasCaptcha) {
      status = "UNKNOWN";
      return;
    }

    // ── Comportement humain : scroll léger ────────────────────────
    await page.mouse.wheel(0, 150 + Math.random() * 200);
    await sleep(500 + Math.random() * 700);

    // Attend que le contenu principal soit chargé
    await page
      .waitForSelector("#search, #rso, #topstuff, #main", { timeout: 10_000 })
      .catch(() => {});

    // ── Détection "aucun résultat" ─────────────────────────────────
    const pageText = (await page.textContent("body")) ?? "";
    const noResultSignals = [
      "n'a renvoyé aucun résultat",
      "did not match any documents",
      "aucun document ne correspond",
      "no results found",
      "0 résultat",
    ];
    const isNoResult = noResultSignals.some((s) =>
      pageText.toLowerCase().includes(s.toLowerCase())
    );

    if (isNoResult) {
      status = "NOT_INDEXED";
      return;
    }

    // ── Détection résultats organiques ────────────────────────────
    // Plusieurs sélecteurs pour couvrir les différentes versions du HTML Google
    const resultSelectors = [
      "#search .g",
      "#rso .g",
      "#rso > div > div",
      ".MjjYud",       // Layout moderne Google
      "div[data-hveid]", // Attribut présent sur chaque résultat
    ].join(", ");

    const resultCount = await page.locator(resultSelectors).count();

    if (resultCount > 0) {
      status = "INDEXED";
    } else {
      // Page chargée mais aucun signal clair → indéterminé
      status = "UNKNOWN";
    }
  } catch {
    status = "UNKNOWN";
  } finally {
    await context.close();
    release();
  }

  await prisma.indexationCheck.create({
    data: { articleId, status, source: "SCRAPING" },
  });
}
