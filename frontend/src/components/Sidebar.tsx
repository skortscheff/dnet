"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Saved Results" },
  { href: "/watchlists", label: "Watchlists" },
  { href: "/alerts", label: "Alerts" },
  { href: "/teams", label: "Teams" },
  { href: "/settings/api-keys", label: "API Keys" },
  { href: "/settings/appearance", label: "Appearance" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <nav className="w-48 shrink-0 border-r border-surface-border pr-4 space-y-1">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`block px-3 py-2 rounded text-sm font-mono transition-colors ${
            path.startsWith(l.href)
              ? "bg-surface text-accent"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-surface-hover"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
