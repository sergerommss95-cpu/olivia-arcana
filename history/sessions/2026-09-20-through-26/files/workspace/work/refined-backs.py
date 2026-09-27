from pathlib import Path
import json, math, xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'outputs/card-back-options-refined'
OUT.mkdir(exist_ok=True)
SOURCE=Path('/Users/macbookpro/olivia-arcana/website/public/olive-mark.svg')
ns={'s':'http://www.w3.org/2000/svg'}
original=ET.parse(SOURCE).getroot()
paths=[e.attrib['d'] for e in original.findall('.//s:path',ns)]
# Identity geometry is taken verbatim from the real brand asset. The engraving
# treatment changes stroke/fill, never the stem, leaf contours or fruit shape.
def mark(x=448,y=768,height=120,color='url(#foil)',angle=0,filled=False):
    s=height/27.7
    stroke=1.35/s
    items=f'<path d="{paths[0]}" mask="url(#fruit-cut)"/>'
    # Outline engraving needs the petioles that the filled source concealed.
    items+='<path d="M.428 7H.5 M-.2535 1H-.5 M-.2239 -5H.5"/>'
    items+=''.join(f'<path d="{d}" fill="{color if filled else "none"}"/>' for d in paths[1:])
    items+='<ellipse cx="0" cy="-13.5" rx="1.7" ry="2.2"/>'
    return f'<g transform="translate({x} {y}) rotate({angle}) scale({s})" fill="none" stroke="{color}" stroke-width="{stroke}" stroke-linecap="round" stroke-linejoin="round">{items}</g>'

def line(d,width=1.35,opacity=1,color='url(#foil)'):
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" opacity="{opacity}" stroke-linecap="round" stroke-linejoin="round"/>'
def rect(inset=58,width=1.25,opacity=.8,color='url(#foil)',radius=6):
    return f'<rect x="{inset}" y="{inset}" width="{896-2*inset}" height="{1536-2*inset}" rx="{radius}" fill="none" stroke="{color}" stroke-width="{width}" opacity="{opacity}"/>'
def ellipse(rx,ry,width=1,opacity=1,angle=0):
    return f'<ellipse cx="448" cy="768" rx="{rx}" ry="{ry}" transform="rotate({angle} 448 768)" fill="none" stroke="url(#foil)" stroke-width="{width}" opacity="{opacity}"/>'
def branch(x,y,scale=1,angle=0,color='url(#foil)'):
    # Original fine botanical drawing; independent decoration around the exact mark.
    d='M0 0 C-20 -95 28 -188 0 -292'
    s=line(d,1.15/scale,color=color)
    for j in range(7):
        yy=-28-j*33;side=1 if j%2==0 else -1
        lo,hi=0.,1.
        for _ in range(28):
            t=(lo+hi)/2;v=3*(1-t)**2*t*(-95)+3*(1-t)*t*t*(-188)+t**3*(-292)
            if v>yy:lo=t
            else:hi=t
        t=(lo+hi)/2
        xx=3*(1-t)**2*t*(-20)+3*(1-t)*t*t*28
        d=f'M{xx} {yy} C{xx+side*21} {yy-4} {xx+side*44} {yy-24} {xx+side*49} {yy-43} C{xx+side*27} {yy-42} {xx+side*8} {yy-19} {xx} {yy}Z'
        s+=line(d,.95/scale,.85,color)
        s+=line(f'M{xx} {yy} Q{xx+side*28} {yy-19} {xx+side*49} {yy-43}',.65/scale,.65,color)
    return f'<g transform="translate({x} {y}) rotate({angle}) scale({scale})">{s}</g>'

def svg(id,name,art,ivory=False):
    colors=('#e6dfcd','#f4efe3','#dccfaa') if ivory else ('#07192b','#102c43','#0b1c2e')
    foil=('#8e784a','#b7a173','#8e784a') if ivory else ('#ad9864','#e2d2a7','#9c8758')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="896" height="1536" viewBox="0 0 896 1536" role="img" aria-label="{id} — {name}">
<title>{id} — {name}</title><desc>Original vector card back for Olivia Arcana. Fine engraved lines, exact olive brand geometry. No generatively redrawn logo.</desc>
<defs>
<radialGradient id="paper" cx="43%" cy="35%" r="84%"><stop stop-color="{colors[1]}"/><stop offset="1" stop-color="{colors[0]}"/></radialGradient>
<linearGradient id="foil" x1="0" y1="0" x2="1" y2=".6"><stop stop-color="{foil[0]}"/><stop offset=".48" stop-color="{foil[1]}"/><stop offset="1" stop-color="{foil[2]}"/></linearGradient>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence baseFrequency=".84" numOctaves="3" seed="19" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
<clipPath id="trim"><rect width="896" height="1536" rx="24"/></clipPath>
<mask id="fruit-cut" maskUnits="userSpaceOnUse" x="-30" y="-30" width="60" height="60"><rect x="-30" y="-30" width="60" height="60" fill="white"/><ellipse cx="0" cy="-13.5" rx="1.7" ry="2.2" fill="black"/></mask>
</defs><g clip-path="url(#trim)"><rect width="896" height="1536" fill="url(#paper)"/><rect width="896" height="1536" filter="url(#grain)" opacity=".027"/>{art}</g></svg>'''

designs=[]
def save(id,name,description,art,ivory=False):
    (OUT/f'{id}.svg').write_text(svg(id,name,art,ivory))
    designs.append(dict(id=id,name=name,description=description))

# 01 — the identity, with only a very fine perimeter rule.
save('01','The Signature','A small engraved olive. A single, fine gold rule.',rect(65,1.25,.88)+mark(height=110))

# 02 — bowed corners, inspired by an engraved bookplate rather than a stone frame.
corner='M92 280 V146 Q92 92 146 92 H280 M106 250 V151 Q106 106 151 106 H250'
art=''.join(f'<g transform="rotate({a} 448 768)">{line(corner,1.1,.86)}</g>' for a in [0,180])
art+=line('M616 92 H750 Q804 92 804 146 V280 M630 106 H745 Q790 106 790 151 V250',1.1,.86)
art+=line('M92 1256 V1390 Q92 1444 146 1444 H280 M106 1286 V1385 Q106 1430 151 1430 H250',1.1,.86)
art+=mark(height=100)+line('M420 893 H476',.95,.85)
save('02','The Bookplate','Four quiet corner gestures around the original olive.',art)

# 03 — two arch contours, no fill, no pillars, no monumental ornament.
arch='M142 1300 V362 C142 210 286 142 448 142 C610 142 754 210 754 362 V1300 C754 1360 698 1394 640 1394 H256 C198 1394 142 1360 142 1300Z'
art=line(arch,1.1,.9)+line('M162 1228 V377 C162 234 296 166 448 166 C600 166 734 234 734 377 V1228',.75,.53)+mark(height=114)
save('03','The Fine Arch','A slender architectural contour, with generous empty space.',art)

# 04 — a small oval cartouche with a subtle engine-turned perimeter.
art=rect(64,.85,.55)
for n in range(17):
    a=2*math.pi*n/16
    rx=161+8*math.cos(a);ry=251+8*math.sin(a)
    art+=ellipse(round(rx,3),round(ry,3),.58,.53)
art+=ellipse(144,234,.9,.9)+mark(height=109)
save('04','Oval Intaglio','Very fine oval engraving around a restrained olive signature.',art)

# 05 — botanical etching uses thin hatching, never heavy carved leaves.
art=rect(66,.95,.72)
art+=branch(190,636,.94,-6)+branch(706,900,.94,174)
art+=branch(706,636,.94,6)+branch(190,900,.94,186)
art+=mark(height=103)
save('05','The Herbarium','Four airy olive boughs, drawn with a fine engraver’s line.',art)

# 06 — quiet repeating linework, with exact identity contours at every repeat.
art=''
for row in range(8):
    for col in range(5):
        x=110+col*169+(row%2)*22;y=145+row*178
        if 280<x<620 and 570<y<970:continue
        art+=f'<g opacity=".21">{mark(x,y,48,color="#b3a379",angle=180 if row%2 else 0)}</g>'
art+=rect(58,.85,.63)+mark(height=114)
save('06','Woven Olive','A tonal repeat, using the same precisely formed olive throughout.',art)

# 07 — an ivory option keeps ink flat and beautifully spare.
art=rect(66,1.05,.88)+rect(74,.45,.35)+mark(height=115,color='#183448')
art+=line('M448 214 V257 M448 1279 V1322',.95,.85)
save('07','Ivory Impression','Warm ivory, a midnight olive and the lightest gold border.',art,True)

# 08 — a pair of exact olive marks make a considered two-ended card back.
art=rect(66,.9,.75)+mark(448,337,91)+mark(448,1199,91,angle=180)
art+=line('M448 440 C315 563 315 676 448 768 C581 860 581 973 448 1096 M448 440 C581 563 581 676 448 768 C315 860 315 973 448 1096',.9,.63)
art+=line('M448 479 C351 580 351 687 448 768 C545 849 545 956 448 1057 M448 479 C545 580 545 687 448 768 C351 849 351 956 448 1057',.55,.38)
save('08','The Paired Seal','Two exact olive marks, joined by fine calligraphic curves.',art)

# 09 — blind-blue engraving enlarged but with uniform hairline widths.
art=rect(56,1,.5,color='#667b88')+f'<g opacity=".38">{mark(height=644,color="#6a8295")}</g>'
art+=mark(448,1303,60)+line('M409 1358 H487',.75,.75)
save('09','Midnight Engraving','A tonal olive drawn in hairlines, with a tiny gold signature below.',art)

# 10 — one authored ribbon, echoing the physical movement of the hero.
art=rect(65,.85,.6)
for j in range(9):
    k=j-4
    d=f'M{246+k*5} 267 C{692+k*6} 477 {205+k*9} 610 {470+k*4} 768 C{735+k*9} 926 {204+k*6} 1059 {650+k*5} 1269'
    art+=line(d,.66,.34+(.2 if j==4 else 0))
art+=mark(448,307,70)+mark(448,1229,70,angle=180)
save('10','The Silk Line','Fine flowing lines, echoing the deck’s movement through space.',art)

(OUT/'designs.json').write_text(json.dumps(designs,ensure_ascii=False,indent=2))
(OUT/'design-notes.md').write_text('''# Olivia Arcana — refined card-back designs

Method: original SVG composition, with the olive geometry extracted directly from the existing brand asset at `/Users/macbookpro/olivia-arcana/website/public/olive-mark.svg`. These are not AI-redrawn logos. The stem and leaf contours and oval fruit geometry are unchanged; the engraving treatment uses outline leaves and carefully controlled stroke widths. The original dew highlight is omitted for this tiny engraved application.

Line weights: primary rules 0.85–1.35 units on an896-unit wide master; ornamental lines0.45–1.15 units. The olive mark uses a consistent1.35-unit engraving line, irrespective of its scale. Artwork has no thick borders, relief, bevels, or stone cracks. SVG masters are editable and resolution independent. PNG and WebP are raster exports of those masters,896×1536.

01 The Signature ·02 The Bookplate ·03 The Fine Arch ·04 Oval Intaglio ·05 The Herbarium ·06 Woven Olive ·07 Ivory Impression ·08 The Paired Seal ·09 Midnight Engraving ·10 The Silk Line.

These are alternatives for selection. None has been applied to the hero. The preceding generated set remains separately preserved.
''')
print('Wrote10 SVG masters and design metadata.')
