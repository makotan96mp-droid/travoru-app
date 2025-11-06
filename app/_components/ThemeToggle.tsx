"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  function applyTheme(t: "light" | "dark") {
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.style.colorScheme = t;
    localStorage.setItem("theme", t);
  }

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("theme")) as
      | "light"
      | "dark"
      | null;
    const t = saved ?? "dark";
    applyTheme(t);
    setTheme(t);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button onClick={toggle} className="px-3 py-1 rounded-xl border">
      {theme === "dark" ? "🌙 Dark" : "🌞 Light"}
    </button>
  );
}
