"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { articleCreateSchema } from "@/lib/validations/article";
import { z } from "zod";

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

    toast.success("Article ajoute");
    router.push(`/campaigns/${campaignId}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter un article</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="articleUrl">URL de l&apos;article *</Label>
            <Input
              id="articleUrl"
              {...register("articleUrl")}
              placeholder="https://blog.example.com/article"
            />
            {errors.articleUrl && (
              <p className="text-sm text-red-500">
                {errors.articleUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetUrl">URL cible du backlink *</Label>
            <Input
              id="targetUrl"
              {...register("targetUrl")}
              placeholder="https://monsite.com/page"
            />
            {errors.targetUrl && (
              <p className="text-sm text-red-500">
                {errors.targetUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="anchorText">Texte d&apos;ancre</Label>
            <Input
              id="anchorText"
              {...register("anchorText")}
              placeholder="Mon texte d'ancre"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Ajout..." : "Ajouter l'article"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
