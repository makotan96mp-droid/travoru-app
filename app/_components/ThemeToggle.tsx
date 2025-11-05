"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle(){
  const [theme, setTheme] = useState<"light"|"dark">("dark");
  useEffect(()=>{
    const saved = (typeof window!=="undefined" && localStorage.getItem("theme")) as "light"|"dark"|null;
    const t = saved ?? "dark"; applyTheme(t); setTheme(t);
  },[]);
  function applyTheme(t:"light"|"dark"){
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.style.colorScheme = t;
    localStorage.setItem("theme", t);
  }
  function toggle(){ const next = theme==="dark" ? "light" : "dark"; applyTheme(next); setTheme(next); }

  return (
    <Button
      variant="outline"
      title="テーマ切替"
      aria-label="テーマ切替"
      style={{ background:"var(--surface)", color:"var(--fg)", border:"1px solid var(--border-subtle)" }}
      onClick={toggle}
    >
      {theme==="dark" ? "🌙 Dark" : "☀️ Light"}
    </Button>
  );
}
