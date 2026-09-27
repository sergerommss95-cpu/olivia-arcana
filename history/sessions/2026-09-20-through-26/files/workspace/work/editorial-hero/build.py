from pathlib import Path
import os, base64, json, subprocess
p=Path(__file__).resolve().parent
root=p.parent.parent
dependencies=p.parent/'background-study/node_modules'
subprocess.run([str(dependencies/'.bin/esbuild'),str(p/'background.js'),'--bundle','--format=iife','--minify','--target=es2022','--legal-comments=inline','--outfile='+str(p/'background.bundle.js')],check=True,env={**os.environ,'NODE_PATH':str(dependencies)})
def data(f):
    return 'data:image/webp;base64,'+base64.b64encode(f.read_bytes()).decode()
art=p.parent/'hero-v12/assets/public/cards-portal'
assets='const BACK_DATA='+json.dumps(data(root/'outputs/olivia-card-back.webp'))+';const DETAIL_DATA='+json.dumps({int(f.name.split('_')[0]):data(f) for f in sorted(art.glob('*.webp')) if int(f.name.split('_')[0])<22})+';'
html=(p/'template.html').read_text()
for token,value in {'/*FONTS*/':(p.parent/'fonts-inline.css').read_text(),'/*STYLE*/':(p/'style.css').read_text(),'/*BACK_IMG*/':data(root/'outputs/olivia-card-back.webp'),'/*ASSETS*/':assets,'/*HERO*/':(p/'hero.js').read_text(),'/*BACKGROUND*/':(p/'background.bundle.js').read_text().replace('</script','<\\/script')}.items():
    html=html.replace(token,value)
licenses='\n'.join((p.parent/x).read_text() for x in ['cormorant-OFL.txt','dmsans-OFL.txt'])
html=html.replace('</head>','<!-- Embedded font licenses\n'+licenses.replace('--','—')+'\n-->\n</head>')
out=root/'outputs/olivia-editorial.html'
out.write_text(html)
print(out, out.stat().st_size)
