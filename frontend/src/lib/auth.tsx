"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getMe } from "./api";
import type { UserOut } from "./types";

interface AuthCtx {
  user: UserOut | null;
  token: string | null;
  loading: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({ user: null, token: null, loading: true, setToken: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("itk_token");
    if (stored) {
      setTokenState(stored);
      getMe(stored)
        .then(setUser)
        .catch(() => { localStorage.removeItem("itk_token"); setTokenState(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) { localStorage.setItem("itk_token", t); getMe(t).then(setUser).catch(() => {}); }
    else { localStorage.removeItem("itk_token"); setUser(null); }
  };

  const logout = () => setToken(null);

  return <Ctx.Provider value={{ user, token, loading, setToken, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
