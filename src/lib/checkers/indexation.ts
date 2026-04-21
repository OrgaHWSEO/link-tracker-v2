/**
 * Vérification d'indexation Google via l'API ValueSERP.
 *
 * Logique : requête "site:URL_DE_L_ARTICLE" sur Google.fr via ValueSERP
 *  - Des résultats organiques existent → INDEXED
 *  - Aucun résultat organique       → NOT_INDEXED
 *  - Erreur API / clé manquante     → UNKNOWN
 */
import { prisma } from "@/lib/prisma";
import { appLog } from "@/lib/logger";

const VALUESERP_API_KEY = process.env.VALUESERP_API_KEY;

interface ValueSerpResponse {
  organic_results?: Array<{ link?: string; title?: string }>;
  search_information?: {
    total_results?: number;
    query_displayed?: string;
  };
  request_info?: {
    success?: boolean;
    message?: string;
  };
}

/**
 * Interroge ValueSERP avec la requête site:articleUrl
 * et retourne le statut d'indexation.
 */
async function performValueSerpCheck(
  articleId: string,
  articleUrl: string
): Promise<"INDEXED" | "NOT_INDEXED" | "UNKNOWN"> {
  if (!VALUESERP_API_KEY) {
    appLog("ERROR", "indexation.check", "Clé API ValueSERP manquante (VALUESERP_API_KEY)", { articleId });
    return "UNKNOWN";
  }

  const query = `site:${articleUrl}`;
  const params = new URLSearchParams({
    api_key: VALUESERP_API_KEY,
    q: query,
    location: "Paris,Ile-de-France,France",
    gl: "fr",
    hl: "fr",
    google_domain: "google.fr",
    include_ai_overview: "false",
  });

  const url = `https://api.valueserp.com/search?${params.toString()}`;

  appLog("INFO", "indexation.check", "Début vérification indexation via ValueSERP", {
    articleId,
    url: articleUrl,
  });

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    appLog("ERROR", "indexation.check", `Erreur API ValueSERP (HTTP ${response.status})`, {
      articleId,
      url: articleUrl,
      status: response.status,
      body: text.slice(0, 500),
    });
    return "UNKNOWN";
  }

  const data: ValueSerpResponse = await response.json();

  if (data.request_info && data.request_info.success === false) {
    appLog("ERROR", "indexation.check", `Erreur ValueSERP : ${data.request_info.message}`, {
      articleId,
      url: articleUrl,
      message: data.request_info.message,
    });
    return "UNKNOWN";
  }

  const organicResults = data.organic_results ?? [];

  if (organicResults.length > 0) {
    appLog("INFO", "indexation.check", `Page indexée (${organicResults.length} résultat(s) ValueSERP)`, {
      articleId,
      url: articleUrl,
      resultCount: organicResults.length,
    });
    return "INDEXED";
  }

  appLog("INFO", "indexation.check", "Page non indexée (aucun résultat ValueSERP)", {
    articleId,
    url: articleUrl,
  });
  return "NOT_INDEXED";
}

export async function checkIndexation(articleId: string): Promise<void> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { articleUrl: true },
  });
  if (!article) return;

  let status: "INDEXED" | "NOT_INDEXED" | "UNKNOWN" = "UNKNOWN";

  try {
    status = await performValueSerpCheck(articleId, article.articleUrl);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    appLog("ERROR", "indexation.check", "Erreur lors de la vérification ValueSERP", {
      articleId,
      url: article.articleUrl,
      error: errorMsg,
    });
    status = "UNKNOWN";
  }

  await prisma.indexationCheck.create({
    data: { articleId, status, source: "VALUESERP" },
  });
}
