"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus, Trash2, Globe, ToggleLeft, ToggleRight,
  ShieldCheck, Info, List, AlignJustify, CheckSquare,
  Square, MinusSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidProxyInput } from "@/lib/proxy-utils";

interface Proxy {
  id: string;
  url: string;
  label: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ProxySettingsProps {
  initialProxies: Proxy[];
}

function maskProxyUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) return url.replace(`:${parsed.password}@`, ":****@");
    return url;
  } catch { return url; }
}

function proxyProtocol(url: string): string {
  try { return new URL(url).protocol.replace(":", "").toUpperCase(); }
  catch { return "HTTP"; }
}

const PROTOCOL_COLORS: Record<string, string> = {
  HTTP:   "bg-sky-50 text-sky-700 ring-sky-200",
  HTTPS:  "bg-indigo-50 text-indigo-700 ring-indigo-200",
  SOCKS4: "bg-violet-50 text-violet-700 ring-violet-200",
  SOCKS5: "bg-purple-50 text-purple-700 ring-purple-200",
};

export function ProxySettings({ initialProxies }: ProxySettingsProps) {
  const [proxies, setProxies] = useState<Proxy[]>(initialProxies);

  // ── Mode d'ajout ──────────────────────────────────────────────
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Mode simple
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);

  // Mode bulk
  const [bulkText, setBulkText] = useState("");
  const [importing, setImporting] = useState(false);

  // Sélection multiple
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // ── Stats ─────────────────────────────────────────────────────
  const activeCount = proxies.filter((p) => p.isActive).length;

  // ── Parsing bulk en temps réel ────────────────────────────────
  const bulkParsed = useMemo(() => {
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const valid = lines.filter(isValidProxyInput);
    const invalid = lines.filter((l) => !isValidProxyInput(l));
    return { valid, invalid, total: lines.length };
  }, [bulkText]);

  // ── Sélection ─────────────────────────────────────────────────
  const allSelected =
    proxies.length > 0 && proxies.every((p) => selected.has(p.id));
  const someSelected =
    selected.size > 0 && !allSelected;

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(proxies.map((p) => p.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // ── Handlers ──────────────────────────────────────────────────
  async function handleAddSingle(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setAdding(true);

    const res = await fetch("/api/proxies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), label: label.trim() }),
    });

    if (res.ok) {
      const proxy: Proxy = await res.json();
      setProxies((prev) => [proxy, ...prev]);
      setUrl(""); setLabel("");
      toast.success("Proxy ajouté");
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Erreur lors de l'ajout");
    }
    setAdding(false);
  }

  async function handleImportBulk() {
    if (!bulkParsed.valid.length) return;
    setImporting(true);

    const res = await fetch("/api/proxies/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: bulkParsed.valid }),
    });

    if (res.ok) {
      const data = await res.json();
      // Merge avec les proxies existants (sans doublons)
      setProxies((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newOnes = (data.proxies as Proxy[]).filter(
          (p) => !existingIds.has(p.id)
        );
        return [...newOnes, ...prev];
      });
      setBulkText("");
      toast.success(
        `${data.imported} proxy${data.imported > 1 ? "s" : ""} importé${data.imported > 1 ? "s" : ""}` +
        (bulkParsed.invalid.length
          ? ` · ${bulkParsed.invalid.length} ignoré${bulkParsed.invalid.length > 1 ? "s" : ""} (format invalide)`
          : "")
      );
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Erreur lors de l'import");
    }
    setImporting(false);
  }

  async function handleToggle(proxy: Proxy) {
    const res = await fetch(`/api/proxies/${proxy.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !proxy.isActive }),
    });
    if (res.ok) {
      setProxies((prev) =>
        prev.map((p) => p.id === proxy.id ? { ...p, isActive: !p.isActive } : p)
      );
    } else toast.error("Erreur lors de la mise à jour");
  }

  async function handleDeleteOne(proxyId: string) {
    const res = await fetch(`/api/proxies/${proxyId}`, { method: "DELETE" });
    if (res.ok) {
      setProxies((prev) => prev.filter((p) => p.id !== proxyId));
      setSelected((prev) => { const n = new Set(prev); n.delete(proxyId); return n; });
      toast.success("Proxy supprimé");
    } else toast.error("Erreur lors de la suppression");
  }

  async function handleDeleteSelected() {
    if (!selected.size) return;
    setDeleting(true);

    const ids = Array.from(selected);
    const results = await Promise.allSettled(
      ids.map((id) => fetch(`/api/proxies/${id}`, { method: "DELETE" }))
    );

    const succeeded = ids.filter((_, i) => results[i].status === "fulfilled");
    setProxies((prev) => prev.filter((p) => !succeeded.includes(p.id)));
    setSelected(new Set());

    if (succeeded.length === ids.length) {
      toast.success(`${succeeded.length} proxy${succeeded.length > 1 ? "s" : ""} supprimé${succeeded.length > 1 ? "s" : ""}`);
    } else {
      toast.error(`${succeeded.length}/${ids.length} supprimés — des erreurs sont survenues`);
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-5">

      {/* ── En-tête ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Proxies de rotation</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Utilisés pour les vérifications Google. Un proxy actif est sélectionné aléatoirement à chaque requête.
          </p>
        </div>
        {proxies.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            {activeCount} actif{activeCount > 1 ? "s" : ""} / {proxies.length}
          </div>
        )}
      </div>

      {/* ── Formats acceptés ──────────────────────────────────── */}
      <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
        <div className="text-xs text-sky-700 space-y-0.5">
          <p className="font-semibold">Formats acceptés (un proxy par ligne en import masse)</p>
          <p className="font-mono">host:port</p>
          <p className="font-mono">host:port:password</p>
          <p className="font-mono">host:port:user:password</p>
          <p className="font-mono">http://user:password@host:port</p>
          <p className="font-mono">socks5://user:password@host:port</p>
        </div>
      </div>

      {/* ── Zone d'ajout ──────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

        {/* Toggle simple / masse */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setMode("single")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors",
              mode === "single"
                ? "bg-white text-indigo-600 border-b-2 border-indigo-500 -mb-px"
                : "text-gray-400 hover:text-gray-600 bg-gray-50"
            )}
          >
            <List className="h-3.5 w-3.5" />
            Un proxy
          </button>
          <button
            onClick={() => setMode("bulk")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors",
              mode === "bulk"
                ? "bg-white text-indigo-600 border-b-2 border-indigo-500 -mb-px"
                : "text-gray-400 hover:text-gray-600 bg-gray-50"
            )}
          >
            <AlignJustify className="h-3.5 w-3.5" />
            Import en masse
          </button>
        </div>

        <div className="p-4">
          {mode === "single" ? (
            /* ── Ajout simple ──────────────────────────────────── */
            <form onSubmit={handleAddSingle} className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="http://user:password@host:port"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 placeholder:text-slate-400 placeholder:font-sans focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="w-36">
                <input
                  type="text"
                  placeholder="Label (optionnel)"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <button
                type="submit"
                disabled={adding || !url.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </button>
            </form>
          ) : (
            /* ── Import en masse ───────────────────────────────── */
            <div className="space-y-3">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"19.24.1.55:12345:monpassword\n1.2.3.4:8080:user:pass\nhttp://user:pass@5.6.7.8:1080\n9.10.11.12:3128\n..."}
                rows={6}
                className="w-full rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 placeholder:text-slate-400 placeholder:font-sans resize-y focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />

              {/* Preview en temps réel */}
              {bulkText.trim() && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                    {bulkParsed.valid.length} valide{bulkParsed.valid.length > 1 ? "s" : ""}
                  </span>
                  {bulkParsed.invalid.length > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-red-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />
                      {bulkParsed.invalid.length} invalide{bulkParsed.invalid.length > 1 ? "s" : ""} (ignoré{bulkParsed.invalid.length > 1 ? "s" : ""})
                    </span>
                  )}
                  <span className="text-gray-400">{bulkParsed.total} ligne{bulkParsed.total > 1 ? "s" : ""} au total</span>
                </div>
              )}

              <button
                onClick={handleImportBulk}
                disabled={importing || !bulkParsed.valid.length}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" />
                {importing
                  ? "Import en cours…"
                  : `Importer ${bulkParsed.valid.length > 0 ? bulkParsed.valid.length + " proxy" + (bulkParsed.valid.length > 1 ? "s" : "") : ""}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Liste ─────────────────────────────────────────────── */}
      {proxies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-12 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Globe className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">Aucun proxy configuré</p>
          <p className="mt-1 text-xs text-gray-400">
            Sans proxy, les vérifications Google utilisent l&apos;IP du serveur.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          {/* Barre de sélection */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-2">
              <span className="text-xs font-semibold text-red-700">
                {selected.size} proxy{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
              </span>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                {deleting ? "Suppression…" : `Supprimer (${selected.size})`}
              </button>
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {/* Checkbox tout sélectionner */}
                <th className="w-10 px-3 py-2.5">
                  <button onClick={toggleSelectAll} className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                    {allSelected
                      ? <CheckSquare className="h-4 w-4 text-indigo-600" />
                      : someSelected
                        ? <MinusSquare className="h-4 w-4 text-indigo-400" />
                        : <Square className="h-4 w-4" />
                    }
                  </button>
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Proxy</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 w-24">Protocole</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 w-24">Statut</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proxies.map((proxy) => {
                const proto = proxyProtocol(proxy.url);
                const protoCls = PROTOCOL_COLORS[proto] ?? PROTOCOL_COLORS.HTTP;
                const isSelected = selected.has(proxy.id);
                return (
                  <tr
                    key={proxy.id}
                    className={cn(
                      "group transition-colors",
                      isSelected ? "bg-indigo-50/60" : "hover:bg-gray-50/60"
                    )}
                  >
                    <td className="px-3 py-3">
                      <button
                        onClick={() => toggleSelect(proxy.id)}
                        className="flex items-center justify-center text-gray-300 hover:text-indigo-500 transition-colors"
                      >
                        {isSelected
                          ? <CheckSquare className="h-4 w-4 text-indigo-600" />
                          : <Square className="h-4 w-4" />
                        }
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-0.5">
                        {proxy.label && (
                          <p className="text-xs font-semibold text-gray-800">{proxy.label}</p>
                        )}
                        <p className="font-mono text-[11px] text-gray-500">
                          {maskProxyUrl(proxy.url)}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset",
                        protoCls
                      )}>
                        {proto}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleToggle(proxy)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
                        title={proxy.isActive ? "Désactiver" : "Activer"}
                      >
                        {proxy.isActive ? (
                          <>
                            <ToggleRight className="h-4 w-4 text-emerald-500" />
                            <span className="text-emerald-700">Actif</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-400">Inactif</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => handleDeleteOne(proxy.id)}
                        className="opacity-0 group-hover:opacity-100 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-300 transition-all hover:bg-red-50 hover:text-red-500"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
