"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Globe, ToggleLeft, ToggleRight, ShieldCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";

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

/** Masque le mot de passe dans l'URL : http://user:****@host:port */
function maskProxyUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      return url.replace(`:${parsed.password}@`, ":****@");
    }
    return url;
  } catch {
    return url;
  }
}

/** Extrait host:port depuis l'URL du proxy */
function proxyHost(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port}`;
  } catch {
    return url;
  }
}

/** Extrait le protocole */
function proxyProtocol(url: string): string {
  try {
    return new URL(url).protocol.replace(":", "").toUpperCase();
  } catch {
    return "HTTP";
  }
}

const PROTOCOL_COLORS: Record<string, string> = {
  HTTP:   "bg-sky-50 text-sky-700 ring-sky-200",
  HTTPS:  "bg-indigo-50 text-indigo-700 ring-indigo-200",
  SOCKS4: "bg-violet-50 text-violet-700 ring-violet-200",
  SOCKS5: "bg-purple-50 text-purple-700 ring-purple-200",
};

export function ProxySettings({ initialProxies }: ProxySettingsProps) {
  const router = useRouter();
  const [proxies, setProxies] = useState<Proxy[]>(initialProxies);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const activeCount = proxies.filter((p) => p.isActive).length;

  async function handleAdd(e: React.FormEvent) {
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
      setUrl("");
      setLabel("");
      toast.success("Proxy ajouté");
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Erreur lors de l'ajout");
    }
    setAdding(false);
  }

  async function handleToggle(proxy: Proxy) {
    const res = await fetch(`/api/proxies/${proxy.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !proxy.isActive }),
    });

    if (res.ok) {
      setProxies((prev) =>
        prev.map((p) => (p.id === proxy.id ? { ...p, isActive: !p.isActive } : p))
      );
    } else {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function handleDelete(proxyId: string) {
    if (!confirm("Supprimer ce proxy ?")) return;

    const res = await fetch(`/api/proxies/${proxyId}`, { method: "DELETE" });
    if (res.ok) {
      setProxies((prev) => prev.filter((p) => p.id !== proxyId));
      toast.success("Proxy supprimé");
    } else {
      toast.error("Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-5">

      {/* ── En-tête + compteur ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Proxies de rotation</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Utilisés pour les vérifications d&apos;indexation sur Google. Un proxy actif est sélectionné aléatoirement à chaque requête.
          </p>
        </div>
        {proxies.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            {activeCount} actif{activeCount > 1 ? "s" : ""} / {proxies.length}
          </div>
        )}
      </div>

      {/* ── Formats acceptés ────────────────────────────────────── */}
      <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
        <div className="text-xs text-sky-700 space-y-0.5">
          <p className="font-semibold">Formats acceptés</p>
          <p className="font-mono">http://user:password@host:port</p>
          <p className="font-mono">socks5://user:password@host:port</p>
          <p className="font-mono">http://host:port &nbsp;(sans authentification)</p>
        </div>
      </div>

      {/* ── Formulaire d'ajout ──────────────────────────────────── */}
      <form
        onSubmit={handleAdd}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Ajouter un proxy
        </p>

        <div className="flex gap-2">
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
          <div className="w-40">
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        </div>
      </form>

      {/* ── Liste des proxies ────────────────────────────────────── */}
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Proxy
                </th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 w-28">
                  Protocole
                </th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 w-28">
                  Statut
                </th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proxies.map((proxy) => {
                const proto = proxyProtocol(proxy.url);
                const protoCls = PROTOCOL_COLORS[proto] ?? PROTOCOL_COLORS.HTTP;
                return (
                  <tr key={proxy.id} className="group hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {proxy.label && (
                          <p className="text-xs font-semibold text-gray-800">{proxy.label}</p>
                        )}
                        <p className="font-mono text-[11px] text-gray-500">
                          {maskProxyUrl(proxy.url)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset",
                        protoCls
                      )}>
                        {proto}
                      </span>
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(proxy.id)}
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
