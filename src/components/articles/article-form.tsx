"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Link2, Target, Type, Euro, Building2, Tag, ArrowLeft, Plus, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormValues {
  articleUrl: string;
  targetUrl: string;
  anchorText: string;
  manualStatus: string;
  prix: string;
  type: string;
  source: string;
}

interface ArticleData {
  id: string;
  articleUrl: string;
  targetUrl: string;
  anchorText: string | null;
  manualStatus: string;
  prix: number | null;
  type: string;
  source: string | null;
}

interface ArticleFormProps {
  campaignId: string;
  article?: ArticleData;
}

const ARTICLE_TYPES = [
  { value: "ARTICLE",    label: "Article",     desc: "Blog / rédactionnel" },
  { value: "FORUM",      label: "Forum",        desc: "Communauté / Q&A"   },
  { value: "COMMUNIQUE", label: "Communiqué",   desc: "Presse / PR"        },
];

export function ArticleForm({ campaignId, article }: ArticleFormProps) {
  const router = useRouter();
  const isEdit = !!article;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      articleUrl: article?.articleUrl ?? "",
      targetUrl:  article?.targetUrl ?? "",
      anchorText: article?.anchorText ?? "",
      manualStatus: article?.manualStatus ?? "PENDING",
      prix: article?.prix != null ? String(article.prix) : "",
      type: article?.type ?? "ARTICLE",
      source: article?.source ?? "",
    },
  });

  const selectedType = watch("type");

  async function onSubmit(data: FormValues) {
    const payload = {
      articleUrl: data.articleUrl,
      targetUrl: data.targetUrl,
      anchorText: data.anchorText,
      manualStatus: data.manualStatus,
      prix: data.prix ? parseFloat(data.prix) : null,
      type: data.type,
      source: data.source,
    };

    const url = isEdit
      ? `/api/campaigns/${campaignId}/articles/${article.id}`
      : `/api/campaigns/${campaignId}/articles`;

    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      toast.error(isEdit ? "Erreur lors de la modification" : "Erreur lors de l'ajout");
      return;
    }

    toast.success(isEdit ? "Backlink mis à jour" : "Backlink ajouté avec succès");
    router.push(`/campaigns/${campaignId}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">

      {/* Back + title */}
      <div className="mb-7">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la campagne
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {isEdit ? "Modifier le backlink" : "Nouveau backlink"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEdit ? "Mettez à jour les informations du lien." : "Renseignez les informations du lien à surveiller."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── Section 01 : Identification ─────────────────────── */}
        <div className="relative mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* accent bar */}
          <div className="absolute inset-y-0 left-0 w-[3px] bg-indigo-500 rounded-l-2xl" />

          <div className="px-7 pt-5 pb-6">
            {/* Section label */}
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white tabular-nums">
                01
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Identification du lien
              </span>
            </div>

            <div className="space-y-4">
              {/* Article URL */}
              <div className="space-y-1.5">
                <Label htmlFor="articleUrl" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Link2 className="h-3.5 w-3.5 text-indigo-400" />
                  URL de l&apos;article
                  <span className="ml-auto text-[10px] font-normal text-red-400">requis</span>
                </Label>
                <div className="relative">
                  <Input
                    id="articleUrl"
                    {...register("articleUrl", { required: "L'URL de l'article est requise" })}
                    placeholder="https://blog.partenaire.com/mon-article"
                    className={cn(
                      "h-11 font-mono text-sm pl-3 pr-3",
                      "bg-slate-50 border-slate-200 text-slate-800",
                      "placeholder:text-slate-400 placeholder:font-sans",
                      "focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-200",
                      errors.articleUrl && "border-red-300 bg-red-50 focus-visible:border-red-400 focus-visible:ring-red-100"
                    )}
                  />
                </div>
                {errors.articleUrl && (
                  <p className="flex items-center gap-1 text-xs text-red-500">
                    <span className="h-1 w-1 rounded-full bg-red-400 inline-block" />
                    {errors.articleUrl.message}
                  </p>
                )}
              </div>

              {/* Target URL */}
              <div className="space-y-1.5">
                <Label htmlFor="targetUrl" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Target className="h-3.5 w-3.5 text-indigo-400" />
                  URL cible du backlink
                  <span className="ml-auto text-[10px] font-normal text-red-400">requis</span>
                </Label>
                <Input
                  id="targetUrl"
                  {...register("targetUrl", { required: "L'URL cible est requise" })}
                  placeholder="https://monsite.com/ma-page"
                  className={cn(
                    "h-11 font-mono text-sm",
                    "bg-slate-50 border-slate-200 text-slate-800",
                    "placeholder:text-slate-400 placeholder:font-sans",
                    "focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-200",
                    errors.targetUrl && "border-red-300 bg-red-50 focus-visible:border-red-400 focus-visible:ring-red-100"
                  )}
                />
                {errors.targetUrl && (
                  <p className="flex items-center gap-1 text-xs text-red-500">
                    <span className="h-1 w-1 rounded-full bg-red-400 inline-block" />
                    {errors.targetUrl.message}
                  </p>
                )}
              </div>

              {/* Anchor text */}
              <div className="space-y-1.5">
                <Label htmlFor="anchorText" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Tag className="h-3.5 w-3.5 text-indigo-400" />
                  Texte d&apos;ancre
                  <span className="ml-auto text-[10px] font-normal text-gray-400">optionnel</span>
                </Label>
                <Input
                  id="anchorText"
                  {...register("anchorText")}
                  placeholder="Ex : meilleur outil SEO"
                  className="h-10 bg-white border-gray-200 focus-visible:border-indigo-400 focus-visible:ring-indigo-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 02 : Métadonnées ────────────────────────── */}
        <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* accent bar */}
          <div className="absolute inset-y-0 left-0 w-[3px] bg-slate-300 rounded-l-2xl" />

          <div className="px-7 pt-5 pb-6">
            {/* Section label */}
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-[10px] font-bold text-gray-500 tabular-nums">
                02
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Métadonnées
              </span>
              <span className="ml-1 text-[11px] text-gray-300">— tout optionnel</span>
            </div>

            <div className="space-y-5">
              {/* Type — pill buttons */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Type className="h-3.5 w-3.5 text-gray-400" />
                  Type de lien
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {ARTICLE_TYPES.map((t) => {
                    const active = selectedType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setValue("type", t.value)}
                        className={cn(
                          "flex flex-col items-start rounded-xl border px-3.5 py-3 text-left transition-all",
                          active
                            ? "border-indigo-300 bg-indigo-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        <span className={cn(
                          "text-sm font-semibold leading-none",
                          active ? "text-indigo-700" : "text-gray-700"
                        )}>
                          {t.label}
                        </span>
                        <span className="mt-1 text-[11px] text-gray-400 leading-tight">
                          {t.desc}
                        </span>
                        {active && (
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-500 self-end" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Source + Prix — 2 columns */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="source" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                    Plateforme / Source
                  </Label>
                  <Input
                    id="source"
                    {...register("source")}
                    placeholder="SEMJuice, Rédac web…"
                    className="h-10 bg-white border-gray-200 focus-visible:border-indigo-400 focus-visible:ring-indigo-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prix" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Euro className="h-3.5 w-3.5 text-gray-400" />
                    Prix
                  </Label>
                  <div className="relative">
                    <Input
                      id="prix"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("prix")}
                      placeholder="0.00"
                      className="h-10 pr-8 bg-white border-gray-200 focus-visible:border-indigo-400 focus-visible:ring-indigo-200"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                      €
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition-all",
              "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]",
              "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? "Enregistrement…" : "Ajout en cours…"}
              </>
            ) : isEdit ? (
              <>
                <Save className="h-4 w-4" />
                Enregistrer les modifications
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Ajouter le backlink
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
