from pathlib import Path
import base64
p=Path(__file__).resolve().parent
root=p.parent.parent
site=p/'assets'
def data(f):return 'data:image/webp;base64,'+base64.b64encode(f.read_bytes()).decode()
moon=data(site/'public/cards-portal/18_the_moon.webp')

html=(p/'template.html').read_text(encoding='utf-8').replace('/*FONTS*/',(root/'work/fonts-inline.css').read_text(encoding='utf-8')).replace('/*BACK_IMG*/',data(root/'outputs/olivia-card-back.webp')).replace('/*ASSETS*/','const BACK_DATA='+__import__('json').dumps(data(root/'outputs/olivia-card-back.webp'))+';const DETAIL_DATA='+__import__('json').dumps({int(f.name.split('_')[0]):data(f) for f in sorted((site/'public/cards-portal').glob('*.webp')) if int(f.name.split('_')[0])<22})+';').replace('/*SCRIPT*/',(p/'hero.js').read_text(encoding='utf-8'))
licenses='\n'.join((root/'work'/x).read_text(encoding='utf-8') for x in ['cormorant-OFL.txt','dmsans-OFL.txt'])
html=html.replace('</head>','<!-- Embedded font licenses\n'+licenses.replace('--','—')+'\n-->\n</head>')
for filename in ['olivia-hero.html','olivia-hero-v9-preview.html']:
    out=root/'outputs'/filename
    temporary=out.with_suffix('.tmp.html')
    temporary.write_text(html,encoding='utf-8')
    temporary.replace(out)
    print(out, out.stat().st_size)
