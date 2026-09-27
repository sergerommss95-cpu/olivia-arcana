from pathlib import Path
import subprocess
import re

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT / 'work/olivia-arcana'
OUT = ROOT / 'outputs'
BASE = '7ba2cfa77d9c6510df74d0722b7ab95c12c50652'

def git(*args):
    return subprocess.check_output(['git', '-C', str(REPO), *args], text=True).strip()

head = git('rev-parse', 'HEAD')
files = git('diff', '--name-only', '--diff-filter=ACMR', BASE, head).splitlines()
latest = set(git('diff', '--name-only', '--diff-filter=ACMR', '87e257d', head).splitlines())
languages = {'.tsx': 'tsx', '.ts': 'typescript', '.mjs': 'javascript', '.css': 'css', '.md': 'markdown', '.json': 'json'}

def export(name, selected, title, intro):
    lines = [f'# {title}', '', f'Current source: `{head}`  ', f'Base repository: `sergerommss95-cpu/olivia-arcana` at `{BASE}`', '', intro, '',
             'Copy each code block into its named file in the existing repository. Keep the other repository files, dependencies and artwork. This is a set of complete source files for the existing project; it is not a standalone HTML website.', '',
             'Saved locally; not deployed. The accompanying implementation report records verification and remaining limits.', '', '## File index', '']
    for i, path in enumerate(selected, 1):
        lines.append(f'{i}. [{path}](#file-{i:02d})' + (' — new study pass' if path in latest else ''))
    for i, path in enumerate(selected, 1):
        content = (REPO / path).read_text()
        fence = '`' * max(3, max((len(run) for run in re.findall(r'`+', content)), default=0) + 1)
        lines.extend(['', '---', '', f'<a id="file-{i:02d}"></a>', '', f'## {i:02d}. {path}', '', f'{fence}{languages.get(Path(path).suffix, "text")}', content.rstrip(), fence])
    (OUT / name).write_text('\n'.join(lines) + '\n')

export('Olivia-Arcana-Complete-Code.md', files, 'Olivia Arcana — complete upgrade code',
       f'Full current contents of all {len(files)} files changed during the upgrade, including the homepage motion refinement, original reading improvements and the new Living Tarot / Celestial Atlas studies.')
export('Olivia-Arcana-DeepSeek-Upgrades-Code.md', [f for f in files if f in latest], 'Olivia Arcana — DeepSeek idea upgrades, full source',
       f'Full source for the {len(latest)} files created or changed in the study pass. Open `/studies/`, `/studies/tarot/` and `/studies/sky/` in the existing Olivia Arcana website. This builds on the prior code snapshot at `87e257d`.')
print(f'Exported {len(files)} cumulative files and {len(latest)} study files at {head}.')
