import HtmlLang from "@/components/HtmlLang";

// Every route under /uk/ is Ukrainian. The exported HTML is marked by
// scripts/postbuild.mjs; this keeps the attribute after client navigation.
export default function UkrainianLayout({ children }: { children: React.ReactNode }) {
  return <>
    <HtmlLang lang="uk" />
    {children}
  </>;
}
