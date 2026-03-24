"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Megaphone, Settings, Link as LinkIcon } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campagnes", icon: Megaphone },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col bg-slate-900">
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
          <LinkIcon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white tracking-wide">LinkTracker PRO</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-indigo-400" : "")} />
              {item.label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-600 text-center">v1.0.0</p>
      </div>
    </aside>
  );
}
