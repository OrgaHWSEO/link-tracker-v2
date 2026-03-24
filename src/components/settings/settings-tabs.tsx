"use client";

import { useState } from "react";
import { User, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsTabsProps {
  profileContent: React.ReactNode;
  proxyContent: React.ReactNode;
  proxyCount: number;
}

export function SettingsTabs({ profileContent, proxyContent, proxyCount }: SettingsTabsProps) {
  const [tab, setTab] = useState<"profile" | "proxy">("profile");

  return (
    <div className="space-y-5">
      {/* ── Tab bar ───────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        <button
          onClick={() => setTab("profile")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            tab === "profile"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <User className="h-3.5 w-3.5" />
          Profil
        </button>
        <button
          onClick={() => setTab("proxy")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            tab === "proxy"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          Proxy
          {proxyCount > 0 && (
            <span className={cn(
              "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
              tab === "proxy"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-200 text-gray-600"
            )}>
              {proxyCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Contenu ───────────────────────────────────────────── */}
      {tab === "profile" && profileContent}
      {tab === "proxy" && proxyContent}
    </div>
  );
}
