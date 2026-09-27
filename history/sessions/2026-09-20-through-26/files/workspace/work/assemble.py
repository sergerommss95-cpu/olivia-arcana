from pathlib import Path
import re, base64
p=Path(__file__).resolve().parent
lib=(p/'three.module.min.js').read_text()
m=re.search(r'export\{([^}]+)\};?\s*$',lib)
assert m
exports=[]
for item in m.group(1).split(','):
    pair=item.strip().split(' as ')
    exports.append((pair[1]+':'+pair[0]) if len(pair)==2 else pair[0])
lib='const THREE=(()=>{'+lib[:m.start()]+'return {'+','.join(exports)+'};})();'
artwork='const SCULPTURE_ATLAS=\"data:image/webp;base64,'+base64.b64encode((p/'assets/sculpture-atlas.webp').read_bytes()).decode()+'\";\nconst SCULPTURE_SUN=\"data:image/webp;base64,'+base64.b64encode((p/'assets/sun-sculpture.webp').read_bytes()).decode()+'\";\n'+(p/'art-surface.js').read_text()
template=(p/'template.html').read_text().replace('/*__ART__*/',artwork).replace('/*__FONTS__*/',(p/'fonts-inline.css').read_text()).replace('/*__THREE__*/',lib).replace('/*__RELIEFS__*/',(p/'card-print.js').read_text()).replace('/*__APP__*/',(p/'app.js').read_text())
out=p.parent/'outputs'/'olivia-arcana.html'
credits='\n'.join((p/name).read_text() for name in ['three-LICENSE.txt','cormorant-OFL.txt','dmsans-OFL.txt'])
template=template.replace('</head>','<!-- Embedded asset licenses\n'+credits.replace('--','—')+'\n-->\n</head>')
out.write_text(template)
print(f'{out}: {out.stat().st_size:,} bytes')
