from pathlib import Path
b=Path('work/olivia-arcana/website/src')
p=b/'app/page.tsx';s=p.read_text();a=s.index('  const heroWords =');z=s.index('  // The frontispiece entrance',a);s=s[:a]+'''  const heroTitle = t("hero_title") as string;
  const heroLines = locale === "en" ? ["Your stars,", "translated clearly."]
    : locale === "uk" ? ["Ваші зірки —", "людською мовою."] : [heroTitle];

'''+s[z:]
# Include all core destinations in the compact menu.
s=s.replace('["Академія", "/academy"],', '["Натальна карта", "/chart"],\n                      ["Карта дня", "/daily"],\n                      ["Тариф", "/pricing"],\n                      ["Академія", "/academy"],')
s=s.replace('["Academy", "/academy"],', '["Birth chart", "/chart"],\n                      ["Daily card", "/daily"],\n                      ["Pricing", "/pricing"],\n                      ["Academy", "/academy"],')
# Scoped hierarchy corrections appended after old wide breakpoint rules.
point=s.index('        /* ── The almanac prints as an almanac.')
s=s[:point]+'''        /* Premium edition: clear navigation, comfortable reading and one foreground act. */
        .masthead-nav { flex-shrink: 0; gap: clamp(1rem, 2vw, 2rem); }
        .masthead-nav :global(.masthead-link), .mast-menu :global(.mast-menu-link) {
          display: inline-flex; align-items: center; min-height: 44px; white-space: nowrap;
        }
        .mast-menu :global(.mast-menu-link) { font-family: var(--font-body); font-size: 13px; letter-spacing: .04em; }
        .mast-more summary { display: flex; align-items: center; min-height: 44px; gap: 6px; font-size: 12px; letter-spacing: .08em; }
        .masthead { padding-top: .6rem; }
        .masthead-row { align-items: center; padding: .4rem 0; }
        .counsel { min-height: 2.6rem; padding-top: .55rem; }
        .plate-body { font-size: 1rem; line-height: 1.8; }
        .plate-numeral, .fig-caption { color: #b8bddb; }
        .masthead :global(a:focus-visible), .mast-more summary:focus-visible, .mast-menu :global(a:focus-visible) { outline: 2px solid #e0b768; outline-offset: 4px; }
        @media (max-width: 1500px) { .masthead-est { display: none; } }
        @media (max-width: 640px) {
          .masthead-nav :global(.masthead-link) { display: none; }
          .masthead-nav { gap: .7rem; }
          .masthead :global(.wordmark) { font-size: 1.2rem; }
          .masthead-nav :global(.masthead-cta) { font-size: .63rem; padding: .6rem .75rem; min-height: 44px; display: inline-flex; align-items: center; }
          .mast-menu { right: -7rem; min-width: 16rem; max-height: min(72svh, 520px); overflow-y: auto; }
          .plate-body { font-size: 1rem; }
        }

'''+s[point:]
p.write_text(s)
p=b/'components/hero/TheArrival.tsx';s=p.read_text();s=s.replace('const fill = root.querySelector<HTMLElement>(".tide-fill")!;', 'const fill = root.querySelector<HTMLElement>(".tide-fill")!;\n    const intro = root.querySelector<HTMLElement>(".tide-intro");');s=s.replace('      const intro = root.querySelector<HTMLElement>(".tide-intro");\n','')
s=s.replace('height: calc(100svh - 150px); min-height: 540px;', 'height: auto; min-height: max(560px, calc(100svh - 130px));')
s=s.replace('.tide-intro { position: absolute;', '.tide-intro { position: relative;')
s=s.replace('top: clamp(38px, 6vh, 90px);', 'padding-top: clamp(38px, 6vh, 90px); padding-bottom: 100px;')
s=s.replace('max-width: 650px; width: 54%;', 'max-width: 760px; width: 64%;')
s=s.replace('max-width: 380px; margin: 0 0 24px;', 'max-width: 440px; margin: 0 0 20px;')
s=s.replace('left: 20px; padding-right: 0; top: 32px;', 'left: 20px; padding-right: 0; padding-top: 32px; padding-bottom: 90px;')
s=s.replace('max-width: 9ch;', 'max-width: 13ch;')
s=s.replace('height: calc(100svh - 116px); min-height: 590px;', 'height: auto; min-height: max(570px, calc(100svh - 116px));')
s=s.replace('Enter the moving frontispiece','Watch the Arrival')
s=s.replace('<button type="button" className="tide-skip">{t.skip} ↗</button>', '<button type="button" className="tide-skip">{immersive ? t.skip : p.locale === "uk" ? "До альманаху" : "Explore the almanac"} ↗</button>')
p.write_text(s)
