"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";

export interface Palette {
  id: string;
  label: string;
  vars: {
    bg: string;
    "bg-secondary": string;
    surface: string;
    "surface-hover": string;
    border: string;
  };
}

export const PALETTES: Palette[] = [
  {
    id: "navy",
    label: "Navy",
    vars: {
      bg: "6 11 20",
      "bg-secondary": "10 16 32",
      surface: "15 21 32",
      "surface-hover": "20 28 46",
      border: "30 45 69",
    },
  },
  {
    id: "slate",
    label: "Slate",
    vars: {
      bg: "10 12 16",
      "bg-secondary": "16 18 24",
      surface: "22 24 32",
      "surface-hover": "28 30 42",
      border: "44 48 64",
    },
  },
  {
    id: "forest",
    label: "Forest",
    vars: {
      bg: "5 12 8",
      "bg-secondary": "8 18 12",
      surface: "12 24 16",
      "surface-hover": "16 32 22",
      border: "24 48 32",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    vars: {
      bg: "8 6 20",
      "bg-secondary": "12 10 30",
      surface: "18 14 40",
      "surface-hover": "24 20 52",
      border: "40 32 72",
    },
  },
];

function applyPalette(id: string) {
  const palette = PALETTES.find((p) => p.id === id) ?? PALETTES[0];
  const root = document.documentElement;
  root.style.setProperty("--color-bg", palette.vars.bg);
  root.style.setProperty("--color-bg-secondary", palette.vars["bg-secondary"]);
  root.style.setProperty("--color-surface", palette.vars.surface);
  root.style.setProperty("--color-surface-hover", palette.vars["surface-hover"]);
  root.style.setProperty("--color-border", palette.vars.border);
}

function clearPaletteVars() {
  const root = document.documentElement;
  root.style.removeProperty("--color-bg");
  root.style.removeProperty("--color-bg-secondary");
  root.style.removeProperty("--color-surface");
  root.style.removeProperty("--color-surface-hover");
  root.style.removeProperty("--color-border");
}

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  palette: string;
  setPalette: (id: string) => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: "dark",
  toggle: () => {},
  palette: "navy",
  setPalette: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [palette, setPaletteState] = useState<string>("navy");

  useEffect(() => {
    const storedTheme = localStorage.getItem("itk_theme") as Theme | null;
    const initialTheme = storedTheme ?? "dark";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");

    const storedPalette = localStorage.getItem("itk_palette") ?? "navy";
    setPaletteState(storedPalette);
    if (initialTheme === "dark") applyPalette(storedPalette);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("itk_theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      if (next === "dark") applyPalette(palette);
      else clearPaletteVars();
      return next;
    });
  };

  const setPalette = (id: string) => {
    setPaletteState(id);
    localStorage.setItem("itk_palette", id);
    if (theme === "dark") applyPalette(id);
  };

  return (
    <Ctx.Provider value={{ theme, toggle, palette, setPalette }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
