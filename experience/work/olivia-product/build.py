"""Build portable HTML and an identical hosted experience with cached assets.

The hosted build keeps artwork/font bytes intact. Content hashes make immutable
asset caching safe; deploy index.html with revalidation and assets/ with a long
max-age. Minor Arcana URLs are resolved only when the interface needs their art.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import base64
import hashlib
import json
import os
import re
import subprocess

p = Path(__file__).resolve().parent
root = p.parent.parent
dependencies = p.parent / 'background-study/node_modules'
esbuild = str(dependencies / '.bin/esbuild')
subprocess.run([
    esbuild, str(p / 'background.js'), '--bundle', '--format=iife', '--minify', '--charset=utf8',
    '--target=es2022', '--legal-comments=inline', '--outfile=' + str(p / 'background.bundle.js'),
], check=True, env={**os.environ, 'NODE_PATH': str(dependencies)})
# app.bundle.js (full, Ukrainian pages) and app.en.bundle.js (no Ukrainian data).
subprocess.run(['node', str(p / 'bundle-app.mjs')], check=True)
# Inlined at the top of <body>: the phone composition before the first paint.
first_frame = subprocess.run([
    esbuild, '--bundle', '--format=iife', '--minify', '--charset=utf8', '--target=es2020', '--sourcefile=first-frame-entry.js',
], input="import {firstFrame,holdSectionArt} from './first-frame.js'; if (firstFrame()) holdSectionArt();", cwd=p, text=True, capture_output=True, check=True).stdout.strip()


def card_files(directory, expected_ids):
    cards = {}
    for file in sorted(directory.glob('*.webp')):
        card_id = int(file.name.split('_')[0])
        if card_id in cards:
            raise ValueError(f'Duplicate card artwork ID {card_id} in {directory}')
        cards[card_id] = file
    if set(cards) != set(expected_ids):
        raise ValueError(f'Card artwork IDs in {directory} must be {list(expected_ids)}; found {sorted(cards)}')
    return cards


major_files = card_files(p.parent / 'hero-v12/assets/public/cards-portal', range(22))
# 512×1024 copies made by work/tools/phone-art.mjs: what hero.js draws on phones.
phone_files = card_files(p.parent / 'hero-v12/assets/public/cards-portal-phone', range(22))
minor_files = card_files(p / 'assets/minor-arcana', range(22, 78))
assert len(major_files.keys() | minor_files.keys()) == 78
back_file = root / 'outputs/olivia-card-back.webp'
# 768 px wide, made by work/tools/phone-art.mjs: the most any phone view shows.
back_phone_file = root / 'outputs/olivia-card-back-phone.webp'
template = (p / 'template.html').read_text()
fonts = (p.parent / 'fonts-inline.css').read_text()
style_names = ['motion-tokens.css', 'style.css', 'home-continuity.css', 'spread-layout.css', 'single-card-flow.css']
if (p / 'practice.css').exists():
    style_names.append('practice.css')
style_names.extend(name for name in ['hero-continuity.css', 'action-affordances.css', 'product-foundations.css', 'question-coach.css', 'almanac-journey.css', 'practice-journey.css', 'physical-reading.css', 'question-history.css', 'lunar-checkin.css', 'first-impression.css', 'symbol-trails.css', 'home-showcase.css', 'spread-ritual.css', 'journey-clarity.css', 'interactive-perimeter.css', 'reading-loader.css', 'reading-pending.css', 'mobile-experience.css', 'mobile-ritual.css', 'mobile-reading.css', 'action-surfaces.css', 'mobile-home-practice.css', 'mobile-home-sections.css', 'support-note.css', 'mobile-coherence.css'] if (p / name).exists())
styles = '\n'.join((p / name).read_text() for name in style_names)
scripts = {
    'hero': (p / 'hero.js').read_text(),
    'background': (p / 'background.bundle.js').read_text(),
    'app': (p / 'app.bundle.js').read_text(),
    'app-en': (p / 'app.en.bundle.js').read_text(),
}
licenses = '\n'.join((p.parent / name).read_text() for name in ['cormorant-OFL.txt', 'dmsans-OFL.txt', 'onest-OFL.txt'])
licenses += '\nAstronomy Engine 2.1.19\n' + (p / 'node_modules/astronomy-engine/esm/astronomy.js').read_text().split('*/',1)[0].replace('/**','').replace('@preserve','').strip()
license_comment = '<!-- Embedded font licenses\n' + licenses.replace('--', '—') + '\n-->\n'


def data(file):
    return 'data:image/webp;base64,' + base64.b64encode(file.read_bytes()).decode()


# Symbol Trails are fetched when the view first opens, one language at a time,
# so their text never weighs on the homepage.
trail_json = json.loads(subprocess.run([
    'node', '--input-type=module', '-e',
    "import {SYMBOL_TRAIL_DATA} from './symbol-trails-data.js';"
    "const pick=l=>SYMBOL_TRAIL_DATA.map(t=>({id:t.id,group:t.group[l],...t[l],cards:t.cards.map(c=>({cardId:c.cardId,slug:c.slug,x:c.x,y:c.y,...c[l]}))}));"
    "process.stdout.write(JSON.stringify({en:JSON.stringify(pick('en')),uk:JSON.stringify(pick('uk'))}));"
], cwd=p, text=True, capture_output=True, check=True).stdout)
trail_data = {language: 'data:application/json;base64,' + base64.b64encode(text.encode()).decode() for language, text in trail_json.items()}


def asset_script(back, major, minor, trails, phone=None, back_phone=None):
    if phone is None:
        return (
            'const BACK_DATA=' + json.dumps(back) + ';const DETAIL_DATA=' + json.dumps(major)
            + ';const MINOR_DATA=' + json.dumps(minor) + ';const TRAILS_DATA=' + json.dumps(trails) + ';'
        )
    # hero.js reads DETAIL_DATA and, below 700 px, draws every card at 512×1024.
    # Phones get that size directly; readings keep full artwork (DETAIL_FULL).
    # Phones also get the 768 px card back, everywhere (the opening poster's
    # <source> uses the same file).
    return (
        'const PHONE_STAGE=((document.querySelector("#motion-stage")||{}).offsetWidth||innerWidth)<700;'
        + 'const BACK_DATA=PHONE_STAGE?' + json.dumps(back_phone) + ':' + json.dumps(back)
        + ';const DETAIL_FULL=' + json.dumps(major)
        + ';const DETAIL_DATA=PHONE_STAGE?' + json.dumps(phone) + ':DETAIL_FULL;const MINOR_DATA=' + json.dumps(minor)
        + ';const TRAILS_DATA=' + json.dumps(trails) + ';'
    )


def inline_script(source):
    return re.sub(r'</script', lambda match: '<\\/script', source, flags=re.IGNORECASE)


replacements = {
    '/*FONTS*/': fonts,
    '/*STYLE*/': styles,
    '/*BACK_IMG*/': data(back_file),
    '/*ASSETS*/': asset_script(data(back_file), {key: data(file) for key, file in major_files.items()}, {key: data(file) for key, file in minor_files.items()}, trail_data),
    '/*HERO*/': inline_script(scripts['hero']),
    '/*APP*/': inline_script(scripts['app']),
    '/*BACKGROUND*/': inline_script(scripts['background']),
    '/*FIRST_FRAME*/': inline_script(first_frame),
    # The single-file page keeps one embedded card back.
    '/*POSTER_SOURCE*/': '',
}
replacements.update({f'/*HOME_CARD_{i}*/': data(major_files[i]) for i in [9,17,2]})
portable = template
for token, value in replacements.items():
    portable = portable.replace(token, value)
portable = portable.replace('</head>', license_comment + '</head>')
portable_path = root / 'outputs/olivia-almanac.html'

# The manifest identifies the current deployment's complete asset set. Files
# from earlier builds are removed at the end: entry pages are served fresh, and
# the only lazily requested assets (card art) keep content-addressed names.
hosted_dir = root / 'outputs/olivia-experience'
assets_dir = hosted_dir / 'assets'
assets_dir.mkdir(parents=True, exist_ok=True)
manifest_assets = {}


def emit_asset(label, content, extension):
    content = content.encode() if isinstance(content, str) else content
    digest = hashlib.sha256(content).hexdigest()
    slug = re.sub(r'[^a-z0-9-]+', '-', label.lower()).strip('-')
    filename = f'{slug}.{digest[:16]}.{extension}'
    destination = assets_dir / filename
    if destination.exists():
        if destination.read_bytes() != content:
            raise ValueError(f'Content hash filename collision: {destination}')
    else:
        destination.write_bytes(content)
    relative = 'assets/' + filename
    manifest_assets[relative] = {'bytes': len(content), 'sha256': digest}
    return relative


hosted_back = emit_asset('card-back', back_file.read_bytes(), 'webp')
hosted_back_phone = emit_asset('card-back-phone', back_phone_file.read_bytes(), 'webp')
hosted_major = {key: emit_asset(file.stem, file.read_bytes(), 'webp') for key, file in major_files.items()}
hosted_minor = {key: emit_asset(file.stem, file.read_bytes(), 'webp') for key, file in minor_files.items()}
hosted_phone = {key: emit_asset(file.stem + '-phone', file.read_bytes(), 'webp') for key, file in phone_files.items()}
hosted_trails = {language: emit_asset('symbol-trails-' + language, text, 'json') for language, text in trail_json.items()}
font_number = 0


def extract_font(match):
    global font_number
    font_number += 1
    mime, encoded = match.groups()
    extensions = {'font/ttf': 'ttf', 'font/otf': 'otf', 'font/woff': 'woff', 'font/woff2': 'woff2', 'application/font-woff': 'woff'}
    if mime not in extensions:
        raise ValueError(f'Unknown embedded font format: {mime}')
    content = base64.b64decode(encoded, validate=True)
    url = emit_asset(f'font-{font_number}', content, extensions[mime])
    # Font URLs resolve relative to emitted CSS, inside assets/.
    return 'url(' + Path(url).name + ')'


hosted_fonts = re.sub(r'url\(data:([^;]+);base64,([A-Za-z0-9+/=]+)\)', extract_font, fonts)
if not font_number or 'data:font/' in hosted_fonts:
    raise ValueError('Embedded fonts were not completely extracted.')
css_url = emit_asset('experience', hosted_fonts + '\n' + styles, 'css')
assets_url = emit_asset('card-assets', asset_script(hosted_back, hosted_major, hosted_minor, hosted_trails, hosted_phone, hosted_back_phone)
    + '\nwindow.OLIVIA_ASSETS={back:BACK_DATA,cards:{...DETAIL_FULL,...MINOR_DATA},trails:TRAILS_DATA};\n', 'js')
script_urls = {name: emit_asset(name, source, 'js') for name, source in scripts.items()}
native_assets_url = emit_asset('native-card-assets', asset_script('/experience/' + hosted_back,
    {key: '/experience/' + value for key, value in hosted_major.items()},
    {key: '/experience/' + value for key, value in hosted_minor.items()},
    {key: '/experience/' + value for key, value in hosted_trails.items()},
    {key: '/experience/' + value for key, value in hosted_phone.items()}, '/experience/' + hosted_back_phone)
    + '\nwindow.OLIVIA_ASSETS={back:BACK_DATA,cards:{...DETAIL_FULL,...MINOR_DATA},trails:TRAILS_DATA};\n', 'js')

hosted = template
hosted, style_count = re.subn(r'<style>\s*/\*FONTS\*/\s*/\*STYLE\*/\s*</style>',
    '<link rel="stylesheet" href="' + css_url + '">', hosted)
hosted, hero_count = re.subn(r'<script>\s*/\*ASSETS\*/[\s\S]*?/\*HERO\*/\s*</script>',
    '<script defer src="' + assets_url + '"></script>\n  <script defer src="' + script_urls['hero'] + '"></script>', hosted)
# The English entry loads the English-only app; Ukrainian swaps in the full one below.
for name, bundle in [('background', 'background'), ('app', 'app-en')]:
    hosted, count = re.subn(r'<script>\s*/\*' + name.upper() + r'\*/\s*</script>',
        '<script defer src="' + script_urls[bundle] + '"></script>', hosted)
    if count != 1:
        raise ValueError(f'Expected one {name} script placeholder; found {count}')
if style_count != 1 or hero_count != 1:
    raise ValueError('Expected exactly one style and hero template block.')
hosted = hosted.replace('/*BACK_IMG*/', hosted_back).replace('/*FIRST_FRAME*/', replacements['/*FIRST_FRAME*/']).replace('</head>', license_comment + '</head>')
hosted = hosted.replace('/*POSTER_SOURCE*/', '<source media="(max-width:699.98px)" srcset="' + hosted_back_phone + '">')
for i in [9,17,2]:
    hosted = hosted.replace(f'/*HOME_CARD_{i}*/', hosted_major[i])
# Ukrainian text is rendered into a separate entry before Next exports /uk/.
# Script and artwork references stay identical across languages.
localizer = subprocess.run([
    'node', '--input-type=module', '-e',
    "import {translateMarkup} from './locale.js'; import {translateHomeMarkup} from './home-showcase.js'; let input=''; for await(const chunk of process.stdin) input+=chunk; process.stdout.write(translateHomeMarkup(translateMarkup(input), 'uk'));"
], cwd=p, input=hosted, text=True, capture_output=True, check=True)
hosted_uk = localizer.stdout
if hosted_uk.count(script_urls['app-en']) != 1:
    raise ValueError('Expected one English app script in the Ukrainian entry.')
hosted_uk = hosted_uk.replace(script_urls['app-en'], script_urls['app'])


class HtmlReferences(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []
        self.inline_scripts = []
        self.current_script = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ['script', 'img', 'source'] and attrs.get('src'):
            self.references.append(attrs['src'])
        if tag == 'source' and attrs.get('srcset'):
            self.references.append(attrs['srcset'].split()[0])
        if tag == 'link' and attrs.get('href') and attrs.get('rel') in ['stylesheet', 'preload']:
            self.references.append(attrs['href'])
        if tag == 'script' and not attrs.get('src'):
            self.current_script = []

    def handle_data(self, value):
        if self.current_script is not None:
            self.current_script.append(value)

    def handle_endtag(self, tag):
        if tag == 'script' and self.current_script is not None:
            self.inline_scripts.append(''.join(self.current_script))
            self.current_script = None


def validate_script(source, label):
    result = subprocess.run(['node', '--check', '--input-type=commonjs'], input=source, text=True, capture_output=True)
    if result.returncode:
        raise ValueError(f'Invalid generated JavaScript in {label}:\n{result.stderr}')


def local_reference(value, base):
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return
    destination = (base / unquote(parsed.path)).resolve()
    if not destination.is_relative_to(hosted_dir.resolve()) or not destination.is_file():
        raise ValueError(f'Missing or out-of-build hosted resource: {value}')


for label, document in [('portable HTML', portable), ('hosted HTML', hosted), ('hosted Ukrainian HTML', hosted_uk)]:
    if any(token in document for token in replacements):
        raise ValueError(f'Unfilled build placeholder in {label}')
    parser = HtmlReferences()
    parser.feed(document)
    for index, source in enumerate(parser.inline_scripts):
        validate_script(source, f'{label} script {index + 1}')
    if label.startswith('hosted'):
        for reference in parser.references:
            local_reference(reference, hosted_dir)

for url in [assets_url, *script_urls.values()]:
    validate_script((hosted_dir / url).read_text(), url)
for url in [hosted_back, hosted_back_phone, *hosted_major.values(), *hosted_minor.values(), *hosted_phone.values()]:
    local_reference(url, hosted_dir)
for match in re.finditer(r'url\(\s*[\'"]?([^\)\'"\s]+)[\'"]?\s*\)', hosted_fonts + '\n' + styles):
    local_reference(match.group(1), assets_dir)

# Write entry documents only after all referenced assets and scripts validate.
portable_path.write_text(portable)
hosted_path = hosted_dir / 'index.html'
hosted_path.write_text(hosted)
(hosted_dir / 'index.uk.html').write_text(hosted_uk)
(hosted_dir / 'LICENSES.txt').write_text(licenses)
manifest = {
    'schemaVersion': 1,
    'html': {'path': 'index.html', 'bytes': hosted_path.stat().st_size, 'sha256': hashlib.sha256(hosted.encode()).hexdigest()},
    'locales': {'en': 'index.html', 'uk': 'index.uk.html'},
    'native': {'assets': native_assets_url, 'scripts': script_urls, 'stylesheet': css_url},
    'deck': {'major': 22, 'minor': 56, 'total': 78},
    'assets': manifest_assets,
    'cache': {'index.html': 'no-cache', 'index.uk.html': 'no-cache', 'assets/*': 'public, max-age=31536000, immutable'},
}
(hosted_dir / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
stale = [file for file in assets_dir.iterdir() if 'assets/' + file.name not in manifest_assets]
for file in stale:
    file.unlink()
print(portable_path, portable_path.stat().st_size)
print(hosted_path, hosted_path.stat().st_size)
print('Removed', len(stale), 'files from earlier builds.')
print('Hosted assets:', len(manifest_assets), 'files;', sum(item['bytes'] for item in manifest_assets.values()), 'bytes total; fonts:', font_number)
print('Validated all generated resource paths and JavaScript; artwork bytes are unchanged.')
