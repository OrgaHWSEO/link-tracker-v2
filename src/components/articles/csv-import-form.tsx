"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";

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
  const [dragging, setDragging] = useState(false);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/campaigns/${campaignId}/articles/import`, {
      method: "POST",
      body: formData,
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Erreur lors de l'import");
      return;
    }

    const data: ImportResult = await res.json();
    setResult(data);
    if (data.imported > 0) toast.success(`${data.imported} articles importés`);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".csv")) {
      setFile(dropped);
      setResult(null);
    } else {
      toast.error("Veuillez déposer un fichier CSV");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Importer via CSV</h1>
        <p className="mt-1 text-sm text-gray-500">
          Importez jusqu&apos;à 500 articles en une seule fois depuis un fichier CSV.
        </p>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-6 space-y-5">
          {/* Drop zone */}
          <label
            htmlFor="csv-file"
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
              dragging
                ? "border-indigo-400 bg-indigo-50"
                : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm mb-3">
              <Upload className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Glissez votre fichier ici ou{" "}
              <span className="text-indigo-600 hover:underline">parcourez</span>
            </p>
            <p className="mt-1.5 text-xs text-gray-400">Uniquement les fichiers .csv — max. 500 lignes</p>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setResult(null);
              }}
            />
          </label>

          {/* Format info */}
          <div className="rounded-lg bg-gray-50 border px-4 py-3 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-700 mb-1.5">Colonnes attendues</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <span><code className="text-indigo-600">article_url</code> — URL de l&apos;article</span>
              <span><code className="text-indigo-600">target_url</code> — URL cible du backlink</span>
              <span><code className="text-indigo-600">anchor_text</code> — Texte d&apos;ancre <span className="text-gray-400">(optionnel)</span></span>
              <span><code className="text-indigo-600">source</code> — Plateforme / source <span className="text-gray-400">(optionnel)</span></span>
              <span><code className="text-indigo-600">type</code> — ARTICLE, FORUM ou COMMUNIQUE <span className="text-gray-400">(optionnel)</span></span>
              <span><code className="text-indigo-600">prix</code> — Prix en euros <span className="text-gray-400">(optionnel)</span></span>
              <span><code className="text-indigo-600">status</code> — Statut initial <span className="text-gray-400">(optionnel)</span></span>
            </div>
          </div>

          {/* File selected */}
          {file && (
            <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                <FileText className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} Ko</p>
              </div>
              <button
                type="button"
                onClick={() => { setFile(null); setResult(null); }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Retirer
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="rounded-lg border overflow-hidden">
              <div className="flex items-center gap-3 bg-emerald-50 border-b px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-medium text-emerald-800">
                  {result.imported} / {result.total} articles importés avec succès
                </span>
              </div>
              {result.errors.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-b">
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <span className="text-sm font-medium text-red-700">{result.errors.length} erreur(s)</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y">
                    {result.errors.map((err, i) => (
                      <div key={i} className="px-4 py-2 text-xs text-red-600 bg-white">
                        <span className="font-medium">Ligne {err.row}</span> — {err.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-xl">
          <Button
            variant="outline"
            className="h-9"
            onClick={() => router.push(`/campaigns/${campaignId}`)}
          >
            Retour
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || loading}
            className="h-9 bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
