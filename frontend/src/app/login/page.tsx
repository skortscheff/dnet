"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { setToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = await login(email, password);
      setToken(token.access_token);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="card p-6">
          <h1 className="font-mono text-base text-slate-200 mb-6">Sign in</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="data-label block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="user@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="data-label block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="font-mono text-xs text-mono-red">✕ {error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 font-mono text-sm"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-500 font-mono">
            No account?{" "}
            <Link href="/register" className="text-accent hover:text-accent-hover transition-colors">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
