"use client";
import { usePathname } from "next/navigation";

/** The root layout does not know the page's language; the path does, on export and after client navigation. */
export default function SkipLink() {
  const pathname = usePathname() ?? "";
  const uk = pathname === "/uk" || pathname.startsWith("/uk/");
  return (
    <a href="#main-content" className="skip-link">
      {uk ? "Перейти до основного вмісту" : "Skip to main content"}
    </a>
  );
}
