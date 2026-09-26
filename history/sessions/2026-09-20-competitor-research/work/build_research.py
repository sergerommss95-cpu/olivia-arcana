from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import json

ROOT = Path('/Users/macbookpro/Documents/Codex/2026-09-20/fi')
OUT = ROOT / 'outputs'
FONTROOT = Path('/Users/macbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype')
for name, file in [('Body','LiberationSans-Regular.ttf'),('Bold','LiberationSans-Bold.ttf'),('Italic','LiberationSans-Italic.ttf'),('Display','LiberationSerif-Regular.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(FONTROOT/file)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Italic',boldItalic='Bold')

W,H = 595.28,841.89
INK='#171936'; MUTED='#56596A'; GOLD='#A07938'; PAPER='#F7F4EC'; RULE='#D8D2C3'
styles = {
 'body': ParagraphStyle('body',fontName='Body',fontSize=10.3,leading=15,textColor=HexColor(INK),spaceAfter=8),
 'small': ParagraphStyle('small',fontName='Body',fontSize=8.7,leading=12.5,textColor=HexColor(MUTED)),
 'h2': ParagraphStyle('h2',fontName='Display',fontSize=20,leading=23,textColor=HexColor(INK)),
 'h3': ParagraphStyle('h3',fontName='Bold',fontSize=11.3,leading=15,textColor=HexColor(INK)),
 'callout': ParagraphStyle('callout',fontName='Display',fontSize=23,leading=28,textColor=HexColor(INK)),
}

data=json.loads((ROOT/'work/research.json').read_text())
c=canvas.Canvas(str(OUT/'olivia-arcana-design-research.pdf'),pagesize=(W,H))
c.setTitle('Olivia Arcana | Competitor & Experience Research')
c.setAuthor('Research prepared with Codex')
bottoms=[]

def para(text,y,style='body',x=46,width=W-92):
    p=Paragraph(text,styles[style]); _,h=p.wrap(width,1000); p.drawOn(c,x,y-h)
    return y-h

def base(num,eyebrow,title,subtitle):
    c.setFillColor(HexColor(PAPER)); c.rect(0,0,W,H,fill=1,stroke=0)
    c.setStrokeColor(HexColor(RULE)); c.setLineWidth(.6); c.line(46,H-40,W-46,H-40)
    c.setFillColor(HexColor(INK)); c.setFont('Bold',8)
    c.drawString(46,H-29,'OLIVIA ARCANA  /  RESEARCH & DESIGN DIRECTION')
    c.setFillColor(HexColor(MUTED)); c.setFont('Body',8); c.drawRightString(W-46,H-29,'20 SEP 2026')
    c.setFillColor(HexColor(GOLD)); c.setFont('Bold',8.5); c.drawString(46,H-66,eyebrow.upper())
    y=para(title,H-80,'callout')-10
    if subtitle: y=para(subtitle,y,'small')-21
    c.setStrokeColor(HexColor(RULE)); c.line(46,41,W-46,41)
    c.setFillColor(HexColor(MUTED)); c.setFont('Body',8)
    c.drawString(46,27,'Public-site research. Links are clickable. Recommendations are proposals.')
    c.drawRightString(W-46,27,f'{num:02d} / {len(data["pages"]):02d}')
    return y

for i,page in enumerate(data['pages'],1):
    y=base(i,page['eyebrow'],page['title'],page.get('subtitle',''))
    for block in page['blocks']:
        kind=block.get('kind','section')
        if kind=='diagram':
            labels=block['labels']; gap=11; box=(W-92-gap*(len(labels)-1))/len(labels)
            for j,label in enumerate(labels):
                x=46+j*(box+gap)
                c.setStrokeColor(HexColor(GOLD)); c.setFillColor(HexColor('#EDE8DB'))
                c.roundRect(x,y-58,box,58,4,stroke=1,fill=1)
                para(label,y-11,'small',x+9,box-18)
                if j<len(labels)-1:
                    c.setFillColor(HexColor(GOLD)); c.setFont('Body',11); c.drawString(x+box+2,y-33,'>')
            y-=77
            continue
        if kind=='rule':
            c.setStrokeColor(HexColor(RULE)); c.line(46,y,W-46,y); y-=17; continue
        if block.get('title'): y=para(block['title'],y,'h2' if kind=='feature' else 'h3')-7
        for t in block.get('text',[]): y=para(t,y,block.get('style','body'))-7
        if block.get('links'):
            links='   |   '.join(f'<a href="{escape(url)}" color="{GOLD}">{escape(label)}</a>' for label,url in block['links'])
            y=para(links,y,'small')-9
        y-=block.get('gap',6)
    bottoms.append(round(y,1))
    if y<56: raise ValueError(f'Page {i} overflows: bottom {y}')
    c.showPage()
c.save()

md=['# Olivia Arcana: competitor and experience research','', 'Researched 20 September 2026. Public pages and selected interactions were inspected. App/account features are official product descriptions unless stated otherwise. Rankings express relevance to Olivia, not traffic or revenue.','']
for page in data['pages']:
    md.extend(['## '+page['title'],'',page.get('subtitle',''),''])
    for block in page['blocks']:
        if block.get('kind')=='rule': continue
        if block.get('kind')=='diagram':
            md.extend([' → '.join(s.replace('<b>','').replace('</b>','').replace('<br/>',' ') for s in block['labels']),'']);continue
        if block.get('title'):md.extend(['### '+block['title'],''])
        for t in block.get('text',[]):
            import re
            t=t.replace('<b>','**').replace('</b>','**').replace('<i>','*').replace('</i>','*').replace('<br/>','\n')
            t=re.sub(r'<[^>]+>','',t)
            md.extend([t,''])
        if block.get('links'):md.extend([' | '.join(f'[{label}]({url})' for label,url in block['links']),''])
(OUT/'olivia-arcana-design-research.md').write_text('\n'.join(md))
print(json.dumps({'pages':len(data['pages']),'page_bottoms':bottoms,'pdf':str(OUT/'olivia-arcana-design-research.pdf')}))
