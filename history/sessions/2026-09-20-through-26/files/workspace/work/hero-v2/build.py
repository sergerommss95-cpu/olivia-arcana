from pathlib import Path
import base64
p=Path(__file__).resolve().parent
root=p.parent.parent
site=Path('/Users/macbookpro/olivia-arcana/website')
def data(f):return 'data:image/webp;base64,'+base64.b64encode(f.read_bytes()).decode()
moon=data(site/'public/cards-portal/18_the_moon.webp')
a=data(site/'public/deck/majors-q80.webp')
html=(p/'template.html').read_text().replace('/*FONTS*/',(root/'work/fonts-inline.css').read_text()).replace('/*MOON_IMG*/',moon).replace('/*ASSETS*/','const ATLAS_DATA='+__import__('json').dumps(a)+';const DETAIL_DATA='+__import__('json').dumps({i:data(site/'public/cards-portal'/f) for i,f in [(2,'02_the_high_priestess.webp'),(17,'17_the_star.webp'),(18,'18_the_moon.webp'),(19,'19_the_sun.webp'),(21,'21_the_world.webp')]})+';').replace('/*SCRIPT*/',(p/'hero.js').read_text())
licenses='\n'.join((root/'work'/x).read_text() for x in ['cormorant-OFL.txt','dmsans-OFL.txt'])
html=html.replace('</head>','<!-- Embedded font licenses\n'+licenses.replace('--','—')+'\n-->\n</head>')
out=root/'outputs/olivia-hero.html';out.write_text(html);print(out, out.stat().st_size)
