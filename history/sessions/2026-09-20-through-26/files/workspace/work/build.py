from pathlib import Path
import re,base64,urllib.request
root=Path(__file__).resolve().parent
css=(root/'fonts.css').read_text()
for url in dict.fromkeys(re.findall(r'url\((https[^)]+)\)',css)):
    data=urllib.request.urlopen(url).read()
    css=css.replace(url,'data:font/ttf;base64,'+base64.b64encode(data).decode())
(root/'fonts-inline.css').write_text(css)
