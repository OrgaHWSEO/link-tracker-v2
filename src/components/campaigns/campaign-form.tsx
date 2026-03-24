"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { campaignCreateSchema } from "@/lib/validations/campaign";
import { z } from "zod";
import { Loader2 } from "lucide-react";

type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;

interface CampaignFormProps {
  defaultValues?: Partial<CampaignCreateInput> & { id?: string };
  isEditing?: boolean;
}

export function CampaignForm({ defaultValues, isEditing = false }: CampaignFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CampaignCreateInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(campaignCreateSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      targetDomain: "",
      status: "ACTIVE",
      checkFrequency: "WEEKLY",
      ...defaultValues,
    },
  });

  const status = watch("status");
  const checkFrequency = watch("checkFrequency");

  async function onSubmit(data: CampaignCreateInput) {
    const url = isEditing ? `/api/campaigns/${defaultValues?.id}` : "/api/campaigns";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error?.formErrors?.[0] || "Erreur lors de la sauvegarde");
      return;
    }

    const campaign = await res.json();
    toast.success(isEditing ? "Campagne mise à jour" : "Campagne créée");
    router.push(`/campaigns/${campaign.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          {isEditing ? "Modifier la campagne" : "Nouvelle campagne"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEditing
            ? "Modifiez les informations de votre campagne."
            : "Renseignez les informations de votre nouvelle campagne de backlinks."}
        </p>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-5">
            {/* Nom */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nom de la campagne <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Ex : Campagne SEO Printemps 2025"
                className="h-10"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Décrivez l'objectif de cette campagne..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Domaine cible */}
            <div className="space-y-1.5">
              <Label htmlFor="targetDomain" className="text-sm font-medium text-gray-700">
                Domaine cible <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  https://
                </span>
                <Input
                  id="targetDomain"
                  {...register("targetDomain")}
                  placeholder="monsite.com"
                  className="h-10 pl-16"
                />
              </div>
              {errors.targetDomain && (
                <p className="text-xs text-red-500">{errors.targetDomain.message}</p>
              )}
            </div>

            {/* Statut + Fréquence */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Statut</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setValue("status", v as CampaignCreateInput["status"])}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Active
                      </span>
                    </SelectItem>
                    <SelectItem value="PAUSED">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        En pause
                      </span>
                    </SelectItem>
                    <SelectItem value="COMPLETED">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-gray-400" />
                        Terminée
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Fréquence de vérification</Label>
                <Select
                  value={checkFrequency}
                  onValueChange={(v) =>
                    setValue("checkFrequency", v as CampaignCreateInput["checkFrequency"])
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Quotidienne</SelectItem>
                    <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                    <SelectItem value="MONTHLY">Mensuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-9"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="h-9 bg-indigo-600 hover:bg-indigo-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : isEditing ? (
                "Mettre à jour"
              ) : (
                "Créer la campagne"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
