from pathlib import Path
import os, base64, json, subprocess
p=Path(__file__).resolve().parent
root=p.parent.parent
dependencies=p.parent/'background-study/node_modules'
subprocess.run([str(dependencies/'.bin/esbuild'),str(p/'background.js'),'--bundle','--format=iife','--minify','--target=es2022','--legal-comments=inline','--outfile='+str(p/'background.bundle.js')],check=True,env={**os.environ,'NODE_PATH':str(dependencies)})
subprocess.run([str(dependencies/'.bin/esbuild'),str(p/'app.js'),'--bundle','--format=iife','--minify','--target=es2022','--outfile='+str(p/'app.bundle.js')],check=True)
def data(f):
    return 'data:image/webp;base64,'+base64.b64encode(f.read_bytes()).decode()
art=p.parent/'hero-v12/assets/public/cards-portal'
def card_assets(directory, expected_ids):
    cards={}
    for f in sorted(directory.glob('*.webp')):
        card_id=int(f.name.split('_')[0])
        if card_id in cards:
            raise ValueError(f'Duplicate card artwork ID {card_id} in {directory}')
        cards[card_id]=data(f)
    if set(cards)!=set(expected_ids):
        raise ValueError(f'Card artwork IDs in {directory} must be {list(expected_ids)}; found {sorted(cards)}')
    return cards
major_assets=card_assets(art,range(22))
minor_assets=card_assets(p/'assets/minor-arcana',range(22,78))
assert len(major_assets.keys()|minor_assets.keys())==78
assets='const BACK_DATA='+json.dumps(data(root/'outputs/olivia-card-back.webp'))+';const DETAIL_DATA='+json.dumps(major_assets)+';const MINOR_DATA='+json.dumps(minor_assets)+';'
html=(p/'template.html').read_text()
for token,value in {'/*FONTS*/':(p.parent/'fonts-inline.css').read_text(),'/*STYLE*/':(p/'style.css').read_text()+'\n'+(p/'home-continuity.css').read_text()+'\n'+(p/'spread-layout.css').read_text()+'\n'+(p/'single-card-flow.css').read_text(),'/*BACK_IMG*/':data(root/'outputs/olivia-card-back.webp'),'/*ASSETS*/':assets,'/*HERO*/':(p/'hero.js').read_text(),'/*APP*/':(p/'app.bundle.js').read_text().replace('</script','<\\/script'),'/*BACKGROUND*/':(p/'background.bundle.js').read_text().replace('</script','<\\/script')}.items():
    html=html.replace(token,value)
licenses='\n'.join((p.parent/x).read_text() for x in ['cormorant-OFL.txt','dmsans-OFL.txt'])
html=html.replace('</head>','<!-- Embedded font licenses\n'+licenses.replace('--','—')+'\n-->\n</head>')
out=root/'outputs/olivia-almanac.html'
out.write_text(html)
print(out, out.stat().st_size)
