"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  return (
    <nav className="border-b border-surface-border bg-navy-800 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        <span className="font-mono font-medium text-accent tracking-wider text-sm">INTERNET TOOLKIT</span>
        <span className="hidden sm:block text-xs text-slate-600 border-l border-surface-border pl-3">
          DNS · BGP · mail · TLS · reachability
        </span>
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {!loading && (
          user ? (
            <>
              <span className="text-slate-500 font-mono text-xs hidden sm:block">{user.email}</span>
              <Link href="/dashboard" className="btn-ghost text-sm py-1">Dashboard</Link>
              <button onClick={logout} className="btn-ghost text-sm py-1">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm py-1">Login</Link>
              <Link href="/register" className="btn-primary text-sm py-1 px-3">Register</Link>
            </>
          )
        )}
      </div>
    </nav>
  );
}
