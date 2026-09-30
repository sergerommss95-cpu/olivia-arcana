"""Write the Telegram Mini App pages (/tg/, /tg/en/, /tg/uk/) from the hosted
experience that experience/build.py has just synced into website/public.

The pages reuse the same hashed assets under /experience/assets/ through the
absolute-path asset map, and leave out the arrival animation (hero) and the
WebGPU backdrop: in Telegram the app opens on Today."""
from pathlib import Path
import json
import re

here = Path(__file__).resolve().parent
public = here.parent.parent / 'website/public'
experience = public / 'experience'
out = public / 'tg'
manifest = json.loads((experience / 'manifest.json').read_text())
native = manifest['native']
SDK = '<script src="https://telegram.org/js/telegram-web-app.js?63"></script>'


def inline(name):
    source = (here / name).read_text()
    if '</script' in source.lower():
        raise ValueError(f'{name} must not contain a closing script tag')
    return source


def telegram_page(html, label):
    html, removed = re.subn(r'\s*<script defer src="assets/(?:hero|background)\.[0-9a-f]+\.js"></script>', '', html)
    if removed != 2:
        raise ValueError(f'{label}: expected to remove the hero and background scripts, removed {removed}')
    html, swapped = re.subn(r'<script defer src="assets/card-assets\.[0-9a-f]+\.js"></script>',
                            f'<script defer src="/experience/{native["assets"]}"></script>', html)
    if swapped != 1:
        raise ValueError(f'{label}: expected one asset map script, found {swapped}')
    html = re.sub(r'(\s(?:src|href|srcset)=")assets/', r'\1/experience/assets/', html)
    head = ('<meta name="theme-color" content="#0b192a">\n  <meta name="robots" content="noindex">\n  '
            + SDK + '\n  <script>' + inline('adapter.js') + '</script>')
    html, count = re.subn(r'<meta name="theme-color" content="#0b192a">', lambda m: head, html, count=1)
    if count != 1:
        raise ValueError(f'{label}: theme-color meta not found')
    for reference in re.findall(r'(?:src|href|srcset)="(/experience/assets/[^"\s]+)', html):
        if not (public / reference.lstrip('/')).is_file():
            raise ValueError(f'{label}: missing asset {reference}')
    if re.search(r'(?:src|href|srcset)="assets/', html):
        raise ValueError(f'{label}: relative asset reference left behind')
    return html


BOOTSTRAP = '''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#0b192a">
  <meta name="robots" content="noindex">
  <title>Olivia Arcana</title>
  <style>html,body{margin:0;min-height:100%;background:#0b192a}</style>
  <script>__LAUNCH__
(function () {
  var stored = null;
  try { stored = localStorage.getItem('olivia-tg-language'); } catch (error) { stored = null; }
  location.replace(oliviaLaunchTarget(location.search, location.hash, stored));
})();
  </script>
</head>
<body></body>
</html>
'''

out.mkdir(exist_ok=True)
for language, source in manifest['locales'].items():
    page = telegram_page((experience / source).read_text(), f'/tg/{language}/')
    (out / language).mkdir(exist_ok=True)
    (out / language / 'index.html').write_text(page)
(out / 'index.html').write_text(BOOTSTRAP.replace('__LAUNCH__', inline('launch.js')))
print(f"Wrote the Telegram Mini App pages into website/public/tg ({', '.join(manifest['locales'])}).")
