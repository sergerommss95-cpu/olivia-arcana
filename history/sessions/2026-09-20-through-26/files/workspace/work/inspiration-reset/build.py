from pathlib import Path
import html, json

root = Path(__file__).resolve().parents[2]
refs = [
 dict(id='01',name='Pierre Legrain',title='Binding for Le Cantique des cantiques',kind='Bookbinding · edition published 1925',
      image='https://www.bnf.fr/sites/default/files/2024-11/tresor-3juin-BNF_2024_168674HD.jpg',
      url='https://www.bnf.fr/fr/agenda/francois-louis-schmied-et-pierre-legrain-le-cantique-des-cantiques-ode-lart-deco',
      credit='Bibliothèque nationale de France · Réserve des livres rares', cls='binding',
      observation='Broad inlaid shapes, tight rows of rings and extremely fine lines have separate jobs. The material supports a deliberate drawing.',
      lesson='For Olivia: a custom O/A construction, one ivory sweep and a few engraved gold lines. Resolve the mark in one colour, then build a reversible inlay composition from it.',
      avoid='Borrow the hierarchy and precision. Do not reproduce this arrangement of bands and circles.'),
 dict(id='02',name='Lotrek / Oath',title='Silk Blue',kind='Contemporary playing-card back',
      image='https://static.wixstatic.com/media/8149fd_2a5ebda9d1f64cf9af384d8016ce7830~mv2.jpg',
      url='https://www.oathplayingcards.com/gallery',credit='Oath Playing Cards · photograph by Melania Damianou',cls='',
      observation='Broad pale silhouettes stay legible above fine directional engraving. Birds and plants belong to one connected structure.',
      lesson='For Olivia: let the entire back carry the identity. Build large ivory forms first; reserve fine detail for their interiors.',
      avoid='Study the changes in scale. Do not reuse its birds, flowers or ornamental composition.'),
 dict(id='03',name='Koloman Moser',title='Forellen-Reigen',kind='Textile pattern · 1899',
      image='https://mak-media.azureedge.net/xl/0477dfe77459f18ea6041d2cc1237dc0.jpg',
      url='https://sammlung.mak.at/de/collect/forellen-reigen_95103',credit='MAK, Vienna · T 5364',cls='',
      observation='Interlocking fish create a larger wave. Figure and background share the same contour, so the spaces between shapes are active parts of the design.',
      lesson='For Olivia: invent an interlocking pair of organic forms. One unit could become the emblem; its repeat could cover the back. The olive can be suggested through taper and growth.',
      avoid='Borrow the relationship between shape and space, not the fish motif.'),
 dict(id='04',name='Japanese katagami',title='Arrow Design Imitating Warp Ikat',kind='Paper stencil · probably Meiji period',
      image='https://images.collection.cooperhewitt.org/56026_3787dda1fd3e1325_b.jpg',
      url='https://www.cooperhewitt.org/2016/09/14/pattern-papers/',credit='Cooper Hewitt, Smithsonian Design Museum',cls='',
      observation='Very narrow cuts create a dense surface, while a few large opposing shapes give it clarity. The fine detail follows a consistent direction.',
      lesson='For Olivia: use engraved lines to create a change in tone around a strong original symbol. Let open blue areas be shaped as carefully as the ivory.',
      avoid='Study the cutting logic. Do not transplant Japanese talismanic motifs as decoration.'),
 dict(id='05',name='Lotrek / Oath',title='Damask Blue',kind='Contemporary playing-card back',
      image='https://static.wixstatic.com/media/8149fd_1e6087f9a5324de3ae420607b8dd48dc~mv2.jpg',
      url='https://www.oathplayingcards.com/gallery',credit='Oath Playing Cards · photograph by Melania Damianou',cls='',
      observation='The ornament continues to the cut edge. Dark intervals separate the reflective forms and keep the dense pattern readable.',
      lesson='For Olivia: compose a continuous shallow relief across the card. Control its open channels and the few places where gold catches the light.',
      avoid='Borrow the surface rhythm. Do not copy the acanthus drawing or its colour treatment.'),
 dict(id='06',name='Giovanni Meroni / Thirdway Industries',title='Lunatica',kind='Contemporary playing-card backs',
      image='https://www.thirdwayindustries.com/wp-content/uploads/2018/01/bakcs.png',
      url='https://www.thirdwayindustries.com/lunatica-playing-cards/',credit='Thirdway Industries · official back comparison',cls='',
      observation='Two different backs share a clear compositional skeleton. Repeated curves and a central interlock make each detail feel related to the rest.',
      lesson='For Olivia: decide on a small family of curves and joints, then use it consistently in the emblem, border and back. Test the whole composition at card size.',
      avoid='Study the consistency. Its neon palette, angular ornament and celestial symbols are not the proposed Olivia direction.')
]
esc = html.escape
def card(r):
    return f'''<article id="ref-{r['id']}">
      <div class="art-meta"><span>{r['id']} / {esc(r['kind'])}</span><a href="{esc(r['url'])}" target="_blank" rel="noopener noreferrer">Source ↗</a></div>
      <a class="picture {r['cls']}" href="{esc(r['image'])}" target="_blank" rel="noopener noreferrer" aria-label="Enlarge {esc(r['title'])}"><img src="{esc(r['image'])}" alt="{esc(r['name'])}: {esc(r['title'])}" referrerpolicy="no-referrer"><span class="enlarge">View image ↗</span></a>
      <p class="credit">{esc(r['credit'])}</p><h2>{esc(r['name'])}</h2><p class="work-title">{esc(r['title'])}</p>
      <p>{esc(r['observation'])}</p><p class="translation">{esc(r['lesson'])}</p>
      <details><summary>What to leave with the original</summary><p>{esc(r['avoid'])}</p></details>
    </article>'''
fonts=(root/'work/fonts.css').read_text()
doc='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Olivia Arcana — A fresh reference study</title><style>'''+fonts+'''
:root{color-scheme:light;--paper:#f0ece3;--ink:#222d32;--muted:#526169;--rule:#c9c6bb;--accent:#4c614f}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:'DM Sans',sans-serif;font-size:16px;line-height:1.6}a{color:inherit;text-underline-offset:4px}a:hover{color:var(--accent)}a:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:5px}header,main,footer{width:min(1360px,calc(100% - 80px));margin:auto}header{padding:36px 0 42px;border-bottom:1px solid var(--rule)}.topline,.art-meta{display:flex;justify-content:space-between;gap:20px;font-size:11px;letter-spacing:.1em;text-transform:uppercase}.topline a{white-space:nowrap}.intro{display:grid;grid-template-columns:1fr .7fr;gap:70px;align-items:end;margin-top:40px}h1,h2,h3{font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;line-height:1.04;margin:0}h1{font-size:clamp(50px,5.7vw,84px);letter-spacing:-.04em;max-width:700px}.intro p{font-size:17px;margin:0;max-width:490px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:70px 42px;padding:44px 0 70px}article{min-width:0;scroll-margin-top:28px}.art-meta{letter-spacing:.05em;align-items:center;margin-bottom:13px;color:var(--muted)}.art-meta span{max-width:75%}.art-meta a{white-space:nowrap}.picture{position:relative;display:block;background:#e3dfd6;height:390px;text-decoration:none;overflow:hidden}.picture img{width:100%;height:100%;object-fit:contain;display:block}.picture.binding img{object-fit:cover}.enlarge{position:absolute;bottom:14px;right:14px;background:var(--paper);padding:6px 11px;font-size:11px;letter-spacing:.06em}.credit{font-size:10px;color:var(--muted);margin:8px 0 23px;line-height:1.5}h2{font-size:36px;letter-spacing:-.018em}.work-title{font-size:13px;color:var(--muted);margin:7px 0 23px}article>p:not(.credit):not(.work-title){max-width:60ch;margin:0 0 14px;font-size:15px}.translation{color:#324d3b}details{font-size:12px;color:var(--muted);margin-top:19px}summary{cursor:pointer}details p{max-width:58ch;margin:10px 0}.next{border-top:1px solid var(--rule);padding:48px 0 56px}.next-head{display:grid;grid-template-columns:1fr 1fr;gap:42px;align-items:start}.next h2{font-size:48px}.next-head>p{margin:0;max-width:60ch}.routes{display:grid;grid-template-columns:1fr 1fr 1fr;gap:34px;margin-top:38px}.routes section{border-top:1px solid var(--rule);padding-top:20px}.routes h3{font-size:32px}.routes p{font-size:14px}.route-label{font-size:10px!important;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin:0 0 12px}.references{font-size:12px!important}.recommendation{font-size:18px;max-width:78ch;border-left:2px solid var(--accent);padding-left:22px;margin:40px 0 0}footer{border-top:1px solid var(--rule);padding:22px 0 40px;color:var(--muted);font-size:11px}footer p{max-width:95ch;margin:0 0 8px}.image-failed .enlarge{position:static;display:block;margin:20px}.image-failed img{height:auto}
@media(min-width:1500px){.picture{height:460px}}@media(max-width:800px){header,main,footer{width:calc(100% - 36px)}header{padding-top:24px}.intro{grid-template-columns:1fr;gap:25px;margin-top:30px}.intro p{font-size:15px}.grid{gap:42px 24px}.picture{height:310px}.picture.binding img{object-fit:contain}h2{font-size:29px}.routes{gap:22px}.next-head{grid-template-columns:1fr;gap:20px}.next h2{font-size:40px}}@media(max-width:590px){.topline{font-size:9px;letter-spacing:.05em}.grid{grid-template-columns:1fr;padding-top:32px}.picture{height:420px}.picture.binding img{object-fit:cover}.routes{grid-template-columns:1fr;gap:24px}.intro h1{font-size:55px}.next{padding-top:35px}}@media(prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
</style><body id="top"><header><div class="topline"><span>Olivia Arcana · Art-direction research</span><a href="#routes">Three possible directions ↓</a></div><div class="intro"><h1>Other places<br>to look.</h1><p>Six references for a fresh start: real card backs, a bookbinding and two kinds of pattern. The notes separate what the originals do from what we could explore for Olivia.</p></div></header><main><div class="grid">'''+''.join(map(card,refs))+'''</div><section class="next" id="routes"><div class="next-head"><h2>Three directions<br>worth drawing.</h2><p>These are proposals from the research, not new artwork. Each starts with a different composition. The lapis, ivory and gold can connect it to your deck once the drawing has a character of its own.</p></div><div class="routes">
<section><p class="route-label">A · Strongest new departure</p><h3>The inlaid monogram</h3><p>A bespoke O/A mark built from one curved stroke and one precise cut. Two opposed versions organise the card back. Broad blue and ivory areas carry the design; gold traces only selected edges.</p><p class="references">Study <a href="#ref-01">Legrain</a> + <a href="#ref-04">katagami</a>.</p></section>
<section><p class="route-label">B · An organic identity</p><h3>The living weave</h3><p>Two flowing forms interlock, with an equally recognisable shape between them. A single unit becomes the emblem. Its repeat gives the reverse a continuous surface, with subtle carved depth.</p><p class="references">Study <a href="#ref-03">Moser</a> + <a href="#ref-05">Damask</a>.</p></section>
<section><p class="route-label">C · A richly engraved reverse</p><h3>The engraved field</h3><p>A bold, original central relationship surrounded by connected, finer engraving. The drawing moves between large silhouettes and quiet detail; one small element can serve as the brand seal.</p><p class="references">Study <a href="#ref-02">Silk</a> + <a href="#ref-06">Lunatica</a>.</p></section>
</div><p class="recommendation">My recommendation: explore A first for the identity, and use Silk as the standard for how a finished back should hold together. The mark should remain recognisable in a plain drawing; material and light can then give the card its depth.</p></section></main><footer><p>Research only. All reference artwork remains credited to its original artist, maker or collection. Images load from the original hosts and require an internet connection. Click an image to inspect it, or “Source” to read the original context.</p><p>The proposed Olivia translations are design interpretations, not statements by the referenced artists.</p></footer><script>document.querySelectorAll('img').forEach(img=>{img.addEventListener('error',()=>{img.parentElement.classList.add('image-failed');img.parentElement.querySelector('.enlarge').textContent='Open original reference image ↗';});});</script></body></html>'''
(root/'outputs/olivia-inspiration-reset.html').write_text(doc)
(root/'work/inspiration-reset/references.json').write_text(json.dumps(refs,ensure_ascii=False,indent=2))
print('Created visual reference study with six credited sources.')
