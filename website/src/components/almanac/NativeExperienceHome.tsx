import fs from "node:fs";
import path from "node:path";
import NativeExperienceRuntime from "./NativeExperienceRuntime";

/** The actual product is in the server HTML. Crawlers and visitors get the same content. */
export default function NativeExperienceHome({locale = "en", entry = "home"}: {locale?: "en" | "uk"; entry?: "home" | "decks"}) {
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
      {entry === "decks" && <style>{`#native-experience[data-entry="decks"]:not([data-ready]) > #hero-region,#native-experience[data-entry="decks"]:not([data-ready]) > #home-content{display:none}.deck-library-entry{padding:clamp(28px,6vw,88px);background:#0b192a;color:#ede4d2;min-height:100svh}.deck-library-entry h1{font:400 clamp(40px,6vw,76px) "Cormorant Garamond",serif}.deck-library-entry article{display:inline-block;width:min(42%,380px);margin:32px 5% 0 0;vertical-align:top}.deck-library-entry img{width:100%;max-height:48vh;object-fit:contain}.deck-library-entry h2{font:400 32px "Cormorant Garamond",serif}.deck-library-entry p{line-height:1.7;max-width:620px}`}</style>}
      {entry === "decks" && <section id="deck-library-entry" className="deck-library-entry">
        <a href={locale === "uk" ? "/uk/" : "/"}>Olivia Arcana</a>
        <h1>{locale === "uk" ? "Знайдіть свою колоду." : "Find the deck that feels like you."}</h1>
        <p>{locale === "uk" ? "Дві авторські колоди, по 78 карт у кожній. Оберіть образи, які відгукуються вам — для щоденних запитань або дослідження стосунків." : "Two original decks, each with all 78 cards. Choose the imagery that speaks to you—for everyday questions or a closer look at relationships."}</p>
        {[["olivia", "Olivia", locale === "uk" ? "Для щоденних запитань, роботи та змін." : "For everyday questions, work, and change."],["space-between", "Amielle", locale === "uk" ? "Сливовий оксамит та мармур. Для близькості та стосунків." : "Aubergine velvet and marble. For connection and relationships."]].map(([id,name,description])=><article key={id}><img src={`/experience/${manifest.decks[id].back}`} alt={name} width="384" height="658"/><h2>{name}</h2><p>{description}</p><a href="#decks">{locale === "uk" ? "Дослідити колоду" : "Explore the deck"} ↗</a></article>)}
      </section>}
      <div id="native-experience" data-entry={entry} dangerouslySetInnerHTML={{__html: markup}} />
      <p id="native-load-status" role="status" hidden />
      <noscript><p className="native-noscript">{locale === "uk" ? "Для вибору карти потрібен JavaScript. Бібліотека карт доступна без нього." : "Drawing cards needs JavaScript. You can explore the card library without it."} <a href={locale === "uk" ? "/uk/cards/" : "/cards/"}>{locale === "uk" ? "Усі 78 карт →" : "All 78 cards →"}</a></p></noscript>
    </div>
    <NativeExperienceRuntime scripts={scripts} locale={locale} entry={entry} />
  </>;
}
