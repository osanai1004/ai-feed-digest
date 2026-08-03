"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid reading theme before mount so SSR HTML matches the first client render.
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={
        mounted
          ? isDark
            ? "ライトモードに切替"
            : "ダークモードに切替"
          : "テーマを切替"
      }
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--card)] px-3 py-2 text-[12px] font-bold text-[var(--ink-soft)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span
        className="flex h-6 w-11 items-center rounded-full p-0.5 transition"
        style={{
          background:
            mounted && isDark
              ? "linear-gradient(90deg, #0ea5a4, #38bdf8)"
              : "#e2e8f0",
        }}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] shadow transition"
          style={{
            transform: isDark ? "translateX(20px)" : "translateX(0)",
          }}
        >
          {mounted ? (isDark ? "☾" : "☀") : "·"}
        </span>
      </span>
      <span>{mounted ? (isDark ? "Dark" : "Light") : "Theme"}</span>
    </button>
  );
}
