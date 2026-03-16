"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react";

interface ImportResult {
  imported: number;
  total: number;
  errors: { row: number; message: string }[];
}

export function CsvImportForm({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleImport() {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `/api/campaigns/${campaignId}/articles/import`,
      {
        method: "POST",
        body: formData,
      }
    );

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Erreur lors de l'import");
      return;
    }

    const data: ImportResult = await res.json();
    setResult(data);

    if (data.imported > 0) {
      toast.success(`${data.imported} articles importes`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importer des articles via CSV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-dashed p-6">
          <div className="space-y-3 text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <div>
              <Label
                htmlFor="csv-file"
                className="cursor-pointer text-blue-600 hover:underline"
              >
                Choisir un fichier CSV
              </Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                className="mt-2"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setResult(null);
                }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Colonnes attendues : article_url, target_url, anchor_text, status
              (optionnel)
            </p>
            <p className="text-xs text-gray-500">Maximum 500 lignes</p>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span>{file.name}</span>
            <span className="text-gray-400">
              ({(file.size / 1024).toFixed(1)} Ko)
            </span>
          </div>
        )}

        {result && (
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                {result.imported} / {result.total} articles importes
              </span>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">
                    {result.errors.length} erreur(s)
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto rounded bg-gray-50 p-2 text-xs">
                  {result.errors.map((err, i) => (
                    <div key={i} className="text-red-600">
                      Ligne {err.row}: {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading ? "Import en cours..." : "Importer"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/campaigns/${campaignId}`)}
          >
            Retour
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
