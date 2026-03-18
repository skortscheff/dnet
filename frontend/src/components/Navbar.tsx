"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme, PALETTES } from "@/lib/theme";

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function UserAvatar({ email }: { email: string }) {
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent/20 text-accent font-mono text-xs font-semibold shrink-0 select-none">
      {email.charAt(0).toUpperCase()}
    </span>
  );
}

function ThemeDropdown() {
  const { theme, toggle, palette, setPalette } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Theme settings"
        className="p-2 rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-colors
                   dark:border-surface-border dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-surface-hover"
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-52 rounded border shadow-lg z-50
                        bg-white border-slate-200
                        dark:bg-navy-900 dark:border-surface-border">
          {/* Mode toggle row */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-surface-border">
            <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Mode</p>
            <button
              onClick={() => { toggle(); }}
              className="flex items-center gap-2 w-full text-left text-sm font-mono
                         text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span className="w-4">{theme === "dark" ? <SunIcon /> : <MoonIcon />}</span>
              Switch to {theme === "dark" ? "light" : "dark"} mode
            </button>
          </div>

          {/* Palette swatches — always shown, note when in light mode */}
          <div className="px-3 py-2">
            <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
              Dark palette
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {PALETTES.map((p) => {
                const isActive = palette === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPalette(p.id)}
                    title={p.label}
                    className={`rounded p-1.5 border transition-all flex flex-col gap-1 items-center ${
                      isActive
                        ? "border-accent ring-1 ring-accent"
                        : "border-slate-200 dark:border-surface-border hover:border-slate-400 dark:hover:border-slate-500"
                    }`}
                  >
                    <span
                      className="block w-5 h-5 rounded"
                      style={{ backgroundColor: `rgb(${p.vars.bg})` }}
                    />
                    <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 leading-none">
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {theme === "light" && (
              <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-2">Applies in dark mode.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout, loading } = useAuth();

  return (
    <nav className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between dark:border-surface-border dark:bg-navy-800">
      <Link href="/" className="flex items-center gap-3">
        <span className="font-mono font-semibold text-accent tracking-wider text-sm">INTERNET TOOLKIT</span>
        <span className="hidden sm:block text-xs text-slate-400 dark:text-slate-600 border-l border-slate-200 dark:border-surface-border pl-3">
          DNS · BGP · mail · TLS · reachability
        </span>
      </Link>

      <div className="flex items-center gap-2 text-sm">
        {!loading && (
          user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 mr-1">
                <UserAvatar email={user.email} />
                <span className="text-slate-500 dark:text-slate-400 font-mono text-xs truncate max-w-[160px]">
                  {user.email}
                </span>
              </div>
              <Link href="/dashboard" className="btn-ghost text-sm py-1 px-3">Dashboard</Link>
              <button onClick={logout} className="btn-ghost text-sm py-1 px-3">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm py-1 px-3">Login</Link>
              <Link href="/register" className="btn-primary text-sm py-1 px-3">Register</Link>
            </>
          )
        )}

        <ThemeDropdown />
      </div>
    </nav>
  );
}
