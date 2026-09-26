"use client";
import { useEffect } from "react";

/** Keeps <html lang> right when client navigation moves between English and Ukrainian pages. */
export default function HtmlLang({ lang }: { lang: "en" | "uk" }) {
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    return () => { if (root.lang === lang) root.lang = lang === "uk" ? "en" : "uk"; };
  }, [lang]);
  return null;
}
