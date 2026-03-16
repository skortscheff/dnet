"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

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

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const { theme, toggle } = useTheme();

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

        <button
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-colors
                     dark:border-surface-border dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-surface-hover"
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </nav>
  );
}
