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
  // Controls work once the app runs; the WebGPU atmosphere is optional and loads last.
  // English pages load the build without the Ukrainian dictionary and card notes.
  const app = locale === "uk" ? manifest.native.scripts.app : manifest.native.scripts["app-en"] ?? manifest.native.scripts.app;
  const scripts = [manifest.native.assets, manifest.native.scripts.hero, app].map(src => `/experience/${src}`);
  const atmosphere = `/experience/${manifest.native.scripts.background}`;
  return <>
    <link rel="stylesheet" href={`/experience/${manifest.native.stylesheet}`} precedence="experience" />
    <div id="main-content" className="olivia-native" lang={locale}>
      <div id="native-experience" dangerouslySetInnerHTML={{__html: markup}} />
      <p id="native-load-status" role="status" hidden />
      <noscript><p className="native-noscript">{locale === "uk" ? "Для вибору карти потрібен JavaScript. Бібліотека карт доступна без нього." : "Drawing cards needs JavaScript. You can explore the card library without it."} <a href={locale === "uk" ? "/uk/cards/" : "/cards/"}>{locale === "uk" ? "Усі 78 карт →" : "All 78 cards →"}</a></p></noscript>
    </div>
    <NativeExperienceRuntime scripts={scripts} atmosphere={atmosphere} locale={locale} />
  </>;
}
