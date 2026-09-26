from pathlib import Path
p=Path(__file__).parent
s=(p/'app.js').read_text()
a=s.index(' const field=[');b=s.index('\n ];',a)+4
s=s[:a]+''' const field=[
 [2.65,.18,-14,-.10,-.22,.19,.95],[5.4,2.8,-19,.15,-.58,-.18,.72],[.9,-3.6,-18,.17,.44,-.24,.72],
 [7.4,-3.1,-22,-.1,.49,.38,.70],[.2,4.9,-22,-.32,-.26,-.31,.58],[7.7,.0,-24,.2,-.55,.2,.77],[-3.5,5.9,-24,.12,.7,-.26,.50],
 [9.0,5.4,-27,.2,.6,.3,.61],[.8,-6.8,-27,.1,-.45,-.15,.66],[-12.4,-2.5,-25,.4,.8,.1,.68],[4.2,-5.6,-26,.2,.6,-.2,.6],[-6.2,8.8,-27,-.2,-.8,.2,.6],
 [10.2,-5.8,-28,.3,-.5,.3,.65],[-12.6,2.1,-25,.15,.4,-.2,.7],[4.6,8.8,-30,.2,.5,.2,.6],[-3.8,-8.5,-28,.1,-.8,.5,.65],
 [12,2,-29,.1,.4,.2,.5],[-14,-1,-28,.2,-.5,-.3,.6],[1.2,9.7,-30,.1,.6,-.2,.6],[-4,10.5,-32,.2,-.3,.1,.55],[6,-8.4,-30,.1,.3,.5,.58],[-9,-9,-31,.1,.4,.1,.6]
 ];'''+s[b:]
s=s.replace("[[4.1,-.35,5.18,1],[4.9,2.3,3.7,.37],[3.55,-.2,.8,.3]]","[[3.2,-.35,5.18,1],[3.8,2.3,3.7,.37],[2.75,-.2,.8,.3]]")
s=s.replace("line.position.set(-.6,.05,-19)","line.position.set(-1.45,.38,-19)")
s=s.replace("const cel=pose((mobile?-.25:-.6)+Math.cos(a)*(mobile?2.9:4.1),Math.sin(a)*2.85,-19+Math.sin(a)*.45,.15,Math.PI*.47,-a-.1,mobile?.36:.51);", "const cx=(mobile?-.15:-1.45)+Math.cos(a)*(mobile?2.05:3.2);\n  const cel=pose(cx,.38+Math.sin(a)*2.24,-19+Math.sin(a)*.45,.10,Math.PI/2-Math.atan(cx/12),-a-.1,mobile?.25:.36);")
s=s.replace("data.body.material.opacity=mix(1,.075+(i%3)*.018,materialGlass);", "data.body.material.opacity=mix(1-cel*.96,.011+(i%3)*.004,materialGlass);")
s=s.replace("data.body.material.depthWrite=materialGlass<.5", "data.body.material.depthWrite=materialGlass<.5&&cel<.2")
s=s.replace("data.edge.material.opacity=mix(1,.44,materialGlass)", "data.edge.material.opacity=mix(1-cel*.58,.72,materialGlass)")
s=s.replace("data.edge.material.depthWrite=materialGlass<.5", "data.edge.material.depthWrite=materialGlass<.5&&cel<.2")
s=s.replace("data.relief.visible=(glass<.25", "data.relief.visible=(cel<.28)&&(glass<.25")
s=s.replace("data.label.visible=glass<.35||(selected&&read>.65);", "data.label.visible=(cel<.22&&glass<.35)||(selected&&read>.65);")
(p/'app.js').write_text(s)
t=(p/'template.html').read_text().replace('header{position:fixed;', 'header{mix-blend-mode:difference;position:fixed;')
t=t.replace('.hero-note{position:absolute;right:var(--gutter);bottom:17%;', '.hero-note{position:absolute;right:var(--gutter);bottom:8%;')
(p/'template.html').write_text(t)
# Keep the three font faces used by the page; all embedded, with original licenses.
css=(p/'fonts-inline.css').read_text()
css=re.sub if False else css
import re
css='\n'.join(face for face in re.findall(r'@font-face\s*\{[^}]+\}',css) if 'font-weight: 500' not in face)
(p/'fonts-inline.css').write_text(css)
assemble=(p/'assemble.py').read_text()
assemble=assemble.replace("out.write_text(template)","credits='\\n'.join((p/name).read_text() for name in ['three-LICENSE.txt','cormorant-OFL.txt','dmsans-OFL.txt'])\ntemplate=template.replace('</head>','<!-- Embedded asset licenses\\n'+credits.replace('--','—')+'\\n-->\\n</head>')\nout.write_text(template)")
(p/'assemble.py').write_text(assemble)
