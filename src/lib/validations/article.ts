import { z } from "zod";

export const articleCreateSchema = z.object({
  articleUrl: z.string().url("URL d'article invalide"),
  targetUrl: z.string().url("URL cible invalide"),
  anchorText: z.string().max(500).optional().default(""),
  manualStatus: z
    .enum(["PENDING", "SENT", "CONFIRMED", "DELETED"])
    .default("PENDING"),
  prix: z.coerce.number().min(0).optional().nullable(),
  type: z.enum(["ARTICLE", "FORUM", "COMMUNIQUE"]).default("ARTICLE"),
  source: z.string().max(200).optional().default(""),
});

export const articleUpdateSchema = articleCreateSchema.partial();

export const articleBulkCreateSchema = z.object({
  articles: z.array(articleCreateSchema).min(1).max(500),
});

export type ArticleCreateInput = z.infer<typeof articleCreateSchema>;
export type ArticleUpdateInput = z.infer<typeof articleUpdateSchema>;
