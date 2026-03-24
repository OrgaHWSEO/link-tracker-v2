"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { articleCreateSchema } from "@/lib/validations/article";
import { z } from "zod";
import { Loader2 } from "lucide-react";

type ArticleCreateInput = z.infer<typeof articleCreateSchema>;

interface ArticleFormProps {
  campaignId: string;
}

export function ArticleForm({ campaignId }: ArticleFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ArticleCreateInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(articleCreateSchema) as any,
    defaultValues: {
      articleUrl: "",
      targetUrl: "",
      anchorText: "",
      manualStatus: "PENDING",
    },
  });

  async function onSubmit(data: ArticleCreateInput) {
    const res = await fetch(`/api/campaigns/${campaignId}/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
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
        <h1 className="text-xl font-semibold text-gray-900">Ajouter un article</h1>
        <p className="mt-1 text-sm text-gray-500">
          Renseignez l&apos;URL de l&apos;article qui contient votre backlink et l&apos;URL vers laquelle il pointe.
        </p>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="articleUrl" className="text-sm font-medium text-gray-700">
                URL de l&apos;article <span className="text-red-500">*</span>
              </Label>
              <Input
                id="articleUrl"
                {...register("articleUrl")}
                placeholder="https://blog.partenaire.com/mon-article"
                className="h-10"
              />
              {errors.articleUrl && (
                <p className="text-xs text-red-500">{errors.articleUrl.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="targetUrl" className="text-sm font-medium text-gray-700">
                URL cible du backlink <span className="text-red-500">*</span>
              </Label>
              <Input
                id="targetUrl"
                {...register("targetUrl")}
                placeholder="https://monsite.com/ma-page"
                className="h-10"
              />
              {errors.targetUrl && (
                <p className="text-xs text-red-500">{errors.targetUrl.message}</p>
              )}
            </div>

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
                "Ajouter l'article"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
