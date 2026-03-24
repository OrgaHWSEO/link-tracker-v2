"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface FormValues {
  articleUrl: string;
  targetUrl: string;
  anchorText: string;
  manualStatus: string;
  prix: string;
  type: string;
  source: string;
}

interface ArticleFormProps {
  campaignId: string;
}

export function ArticleForm({ campaignId }: ArticleFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      articleUrl: "",
      targetUrl: "",
      anchorText: "",
      manualStatus: "PENDING",
      prix: "",
      type: "ARTICLE",
      source: "",
    },
  });

  const type = watch("type");

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

    const res = await fetch(`/api/campaigns/${campaignId}/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      toast.error("Erreur lors de l'ajout");
      return;
    }

    toast.success("Article ajouté");
    router.push(`/campaigns/${campaignId}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Ajouter un backlink</h1>
        <p className="mt-1 text-sm text-gray-500">
          Renseignez les informations du backlink à surveiller.
        </p>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="p-6 space-y-5">

            {/* URL article */}
            <div className="space-y-1.5">
              <Label htmlFor="articleUrl" className="text-sm font-medium text-gray-700">
                URL de l&apos;article <span className="text-red-500">*</span>
              </Label>
              <Input
                id="articleUrl"
                {...register("articleUrl", { required: "L'URL de l'article est requise" })}
                placeholder="https://blog.partenaire.com/mon-article"
                className="h-10"
              />
              {errors.articleUrl && (
                <p className="text-xs text-red-500">{errors.articleUrl.message}</p>
              )}
            </div>

            {/* URL cible */}
            <div className="space-y-1.5">
              <Label htmlFor="targetUrl" className="text-sm font-medium text-gray-700">
                URL cible du backlink <span className="text-red-500">*</span>
              </Label>
              <Input
                id="targetUrl"
                {...register("targetUrl", { required: "L'URL cible est requise" })}
                placeholder="https://monsite.com/ma-page"
                className="h-10"
              />
              {errors.targetUrl && (
                <p className="text-xs text-red-500">{errors.targetUrl.message}</p>
              )}
            </div>

            {/* Ancre */}
            <div className="space-y-1.5">
              <Label htmlFor="anchorText" className="text-sm font-medium text-gray-700">
                Texte d&apos;ancre
                <span className="ml-2 text-xs font-normal text-gray-400">optionnel</span>
              </Label>
              <Input
                id="anchorText"
                {...register("anchorText")}
                placeholder="Ex : meilleur outil SEO"
                className="h-10"
              />
            </div>

            {/* Source + Type */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="source" className="text-sm font-medium text-gray-700">
                  Source / Plateforme
                  <span className="ml-2 text-xs font-normal text-gray-400">optionnel</span>
                </Label>
                <Input
                  id="source"
                  {...register("source")}
                  placeholder="Ex : Rédacteur Web, SEMJuice..."
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Type de lien</Label>
                <Select value={type} onValueChange={(v) => setValue("type", v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARTICLE">Article</SelectItem>
                    <SelectItem value="FORUM">Forum</SelectItem>
                    <SelectItem value="COMMUNIQUE">Communiqué</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prix */}
            <div className="space-y-1.5">
              <Label htmlFor="prix" className="text-sm font-medium text-gray-700">
                Prix (€)
                <span className="ml-2 text-xs font-normal text-gray-400">optionnel</span>
              </Label>
              <Input
                id="prix"
                type="number"
                step="0.01"
                min="0"
                {...register("prix")}
                placeholder="Ex : 150.00"
                className="h-10"
              />
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-9"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout...
                </>
              ) : (
                "Ajouter le backlink"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
