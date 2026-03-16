"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;

interface CampaignFormProps {
  defaultValues?: Partial<CampaignCreateInput> & { id?: string };
  isEditing?: boolean;
}

export function CampaignForm({
  defaultValues,
  isEditing = false,
}: CampaignFormProps) {
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
    const url = isEditing
      ? `/api/campaigns/${defaultValues?.id}`
      : "/api/campaigns";
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
    toast.success(isEditing ? "Campagne mise a jour" : "Campagne creee");
    router.push(`/campaigns/${campaign.id}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Modifier la campagne" : "Nouvelle campagne"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la campagne *</Label>
            <Input id="name" {...register("name")} placeholder="Ma campagne SEO" />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Description de la campagne..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDomain">Domaine cible *</Label>
            <Input
              id="targetDomain"
              {...register("targetDomain")}
              placeholder="example.com"
            />
            {errors.targetDomain && (
              <p className="text-sm text-red-500">
                {errors.targetDomain.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setValue("status", v as CampaignCreateInput["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">En pause</SelectItem>
                  <SelectItem value="COMPLETED">Terminee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequence de verification</Label>
              <Select
                value={checkFrequency}
                onValueChange={(v) =>
                  setValue(
                    "checkFrequency",
                    v as CampaignCreateInput["checkFrequency"]
                  )
                }
              >
                <SelectTrigger>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de debut</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Sauvegarde..."
                : isEditing
                ? "Mettre a jour"
                : "Creer la campagne"}
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
