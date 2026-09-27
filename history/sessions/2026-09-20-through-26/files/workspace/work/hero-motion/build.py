from pathlib import Path
import base64
p=Path(__file__).resolve().parent
root=p.parent.parent
site=Path('/Users/macbookpro/olivia-arcana/website')
def data(f):return 'data:image/webp;base64,'+base64.b64encode(f.read_bytes()).decode()
moon=data(site/'public/cards-portal/18_the_moon.webp')
a=data(site/'public/deck/majors-q80.webp')
html=(p/'template.html').read_text().replace('/*FONTS*/',(root/'work/fonts-inline.css').read_text()).replace('/*MOON_IMG*/',moon).replace('/*ASSETS*/','const ATLAS_DATA="'+a+'";const MOON_DATA="'+moon+'";').replace('/*SCRIPT*/',(p/'study.js').read_text())
licenses='\n'.join((root/'work'/x).read_text() for x in ['cormorant-OFL.txt','dmsans-OFL.txt'])
html=html.replace('</head>','<!-- Embedded font licenses\n'+licenses.replace('--','—')+'\n-->\n</head>')
out=root/'outputs/olivia-hero-motion-study.html';out.write_text(html);print(out, out.stat().st_size)
