import fs from "node:fs";
import path from "node:path";
import NativeExperienceRuntime from "./NativeExperienceRuntime";

/** The actual product is in the server HTML. Crawlers and visitors get the same content. */
export default function NativeExperienceHome({locale = "en"}: {locale?: "en" | "uk"}) {
  const directory = path.join(process.cwd(), "public/experience");
  const file = locale === "uk" && fs.existsSync(path.join(directory,"index.uk.html")) ? "index.uk.html" : "index.html";
  const source = fs.readFileSync(path.join(directory,file), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(directory,"manifest.json"), "utf8"));
  const body = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  if (!body || !manifest.native) throw new Error("Build the Olivia experience before exporting the website.");
  const markup = body.replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/(["'])assets\//g, "$1/experience/assets/");
  const scripts = [manifest.native.assets, ...["hero","background","app"].map(key => manifest.native.scripts[key])]
    .map(src => `/experience/${src}`);
  return <>
    <link rel="stylesheet" href={`/experience/${manifest.native.stylesheet}`} precedence="experience" />
    <div id="main-content" className="olivia-native" lang={locale}>
      <div id="native-experience" dangerouslySetInnerHTML={{__html: markup}} />
      <p id="native-load-status" role="status" hidden />
      <noscript><p className="native-noscript">{locale === "uk" ? "Для вибору карти потрібен JavaScript. Бібліотека карт доступна без нього." : "Drawing cards needs JavaScript. You can explore the card library without it."} <a href={locale === "uk" ? "/uk/cards/" : "/cards/"}>{locale === "uk" ? "Усі 78 карт →" : "All 78 cards →"}</a></p></noscript>
    </div>
    <NativeExperienceRuntime scripts={scripts} locale={locale} />
  </>;
}
