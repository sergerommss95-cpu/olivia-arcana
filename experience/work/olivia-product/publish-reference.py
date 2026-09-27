"""Publish the recovered hero without modifying either original rendering script.

Only the surrounding preview links/toolbar are adapted for the live product.
The untouched source is also published for provenance and future recovery.
"""
from pathlib import Path
import hashlib
import json
import re

root = Path(__file__).resolve().parents[2]
source = root / 'outputs/olivia-approved-motion-2026-09-24.html'
metadata = json.loads(source.with_suffix('.json').read_text())
original = source.read_text()
assert hashlib.sha256(source.read_bytes()).hexdigest() == metadata['sha256']
html = original.replace('<title>Olivia Arcana — Light Leaks 1</title>', '<title>Olivia Arcana — The unfolding</title>')
html = html.replace('href="https://oliviaarcana.com/"', 'href="/" target="_top"')
html = html.replace('href="https://oliviaarcana.com/daily"', 'href="/?experience=journal" target="_top"')
html = html.replace('href="https://oliviaarcana.com/oracle"', 'href="/?experience=question" target="_top"')
html = html.replace('>The Oracle <span', '>Begin a reading <span').replace('>Enter the Oracle <span', '>Begin a reading <span')
toolbar = '''<aside class="study-controls live-navigation" aria-label="Continue with Olivia">
<a class="back-home" href="/" target="_top">← Back to Olivia</a>
<nav aria-label="Your practice"><a href="/?experience=journal" target="_top">My almanac</a><a href="/?experience=spreads" target="_top">Explore spreads</a><a class="begin-reading" href="/?experience=question" target="_top">Begin a reading <span aria-hidden="true">↗</span></a></nav>
<div hidden><button type="button" data-frame="0" aria-pressed="true">Opening</button><button type="button" data-frame="0.82" aria-pressed="false">Moon reveal</button><button type="button" id="background-toggle" aria-pressed="false">Background only</button></div>
</aside>'''
html, count = re.subn(r'<aside class="study-controls"[^>]*>.*?</aside>', lambda _: toolbar, html, count=1, flags=re.S)
assert count == 1
style = '''<style>
.live-navigation{display:flex;flex-direction:row;justify-content:space-between;background:#0b192a;gap:20px}
.live-navigation nav{display:flex;align-items:center;gap:24px}
.live-navigation a{display:inline-flex;align-items:center;justify-content:center;gap:22px;min-height:44px;font-size:12px;color:#ede4d2;transition:background .2s,color .2s}
.live-navigation .begin-reading{background:#ede4d2;color:#0b192a;padding:12px 20px;border:1px solid #ede4d2}
.live-navigation a:hover{color:#d9b982}.live-navigation .begin-reading:hover{background:#f7f0e4;color:#0b192a}
.live-navigation [hidden]{display:none!important}
@media(max-width:650px){.live-navigation{display:flex;flex-wrap:wrap;justify-content:space-between;align-content:center;gap:2px;padding:6px 5%}.live-navigation .back-home{min-height:30px;font-size:11px}.live-navigation nav{width:100%;justify-content:space-between;gap:10px}.live-navigation a{font-size:10px;gap:10px}.live-navigation .begin-reading{padding:10px 12px}}
</style>'''
html = html.replace('</head>', style + '</head>', 1)
# A homepage click enters the original player and starts its existing control.
# No timing, camera, shader, geometry, scroll, or pose code is replaced here.
start = '''<script>
(()=>{if(new URLSearchParams(location.search).get('play')!=='1')return;
const root=document.documentElement;
function start(){if(root.classList.contains('quiet')||root.classList.contains('fallback')){observer.disconnect();return;}
if(!root.classList.contains('ready'))return;observer.disconnect();document.querySelector('#journey').click();}
const observer=new MutationObserver(start);observer.observe(root,{attributes:true,attributeFilter:['class']});start();})();
</script>'''
html = html.replace('</body>', start + '</body>', 1)
original_scripts = re.findall(r'<script\b[^>]*>(.*?)</script>', original, re.S)
deployed_scripts = re.findall(r'<script\b[^>]*>(.*?)</script>', html, re.S)
assert deployed_scripts[:len(original_scripts)] == original_scripts, 'Original runtime must remain byte-for-byte unchanged'
destination = root / 'outputs/olivia-animation'
destination.mkdir(exist_ok=True)
(destination / 'index.html').write_text(html)
(destination / 'original.html').write_bytes(source.read_bytes())
manifest = {
    'source': source.name,
    'source_sha256': metadata['sha256'],
    'index_sha256': hashlib.sha256(html.encode()).hexdigest(),
    'original_script_hashes': [hashlib.sha256(s.encode()).hexdigest() for s in original_scripts],
    'original_runtime_unchanged': True,
    'changes': ['Product navigation links', 'Preview toolbar becomes product navigation at identical height', 'Optional play=1 starts original playback control'],
}
(destination / 'provenance.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(json.dumps(manifest, indent=2))
