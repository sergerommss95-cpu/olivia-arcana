#!/usr/bin/env python3
"""Render dispatcher: feeds shots flagged as final by the set builders to whichever GPU pod is free, and pulls each
finished clip straight back into false_floor/out/clips/.

    cd films && python3 gpu/dispatch.py --pods /root/.runpod/pod1.json,/root/.runpod/pod3.json [--extra S36,S03]

Queue = IDs listed in false_floor/notes/ready_*.txt (one per line) + --extra, minus what is already done this run.
A shot removed from its ready file before it starts is dropped; one re-listed after a builder change is re-rendered
when its line reappears with a '!' suffix (e.g. "S25!"). 3D shots go first, longest first. Status:
false_floor/out/dispatch.json, log: false_floor/out/dispatch.log. Stops when --until-empty and nothing is left.
"""
import glob, io, json, os, shutil, sys, tarfile, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import runpod_client as R

FILMS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = os.path.join(FILMS, 'false_floor')
SHOTS = {s['id']: s for s in json.load(open(os.path.join(FF, 'script', 'SHOTS_v2.json')))['shots']}
SHOTS.update({s['id']: s for s in json.load(open(os.path.join(FF, 'script', 'SEQ_NIGHT.json')))['shots'] if s['kind'] == '3D'})
SHOTS.update({s['id']: s for s in json.load(open(os.path.join(FF, 'script', 'SEQ_COLD.json')))['shots'] if s['kind'] == '3D'})
for _k in ('S45a', 'S45b'):
    SHOTS.setdefault(_k, {'id': _k, 'kind': '3DS', 'owner': 'B_room', 'render_frames': 1})
STATUS = os.path.join(FF, 'out', 'dispatch.json')
LOG = os.path.join(FF, 'out', 'dispatch.log')


def arg(n, d=None):
    return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d


def log(msg):
    line = time.strftime('%H:%M:%S ') + msg
    print(line, flush=True)
    open(LOG, 'a').write(line + '\n')


def on(pod):
    R.STATE = pod


def wanted():
    ids = []
    for f in sorted(glob.glob(os.path.join(FF, 'notes', 'ready_*.txt'))):
        for ln in open(f):
            t = ln.strip().split()[0] if ln.strip() else ''
            if t.rstrip('!') in SHOTS:
                ids.append(t)
    ids += [x for x in (arg('--extra', '') or '').split(',') if x]
    return ids


def main():
    os.chdir(FILMS)
    pods_arg = arg('--pods')
    read_pods = lambda: ([l.strip() for l in open(pods_arg) if l.strip()] if pods_arg.endswith('.txt') else pods_arg.split(','))
    st = json.load(open(STATUS)) if os.path.exists(STATUS) else {'done': {}, 'running': {}}
    st.setdefault('done', {})
    st['running'] = {}
    busy = {}                                    # pod -> (sid, job id, t0)
    while True:
        # finished jobs
        for pod, (sid, jid, t0) in list(busy.items()):
            on(pod)
            try:
                j = R.worker('GET', f'/job?id={jid}&tail=3000')
            except Exception as e:
                log(f'{pod[-10:-5]} poll error {sid}: {e}')
                continue
            if j['rc'] is None:
                continue
            del busy[pod]
            st['running'].pop(sid, None)
            ext = 'mkv' if SHOTS[sid]['kind'] == '3D' else 'png'
            ok = j['rc'] == 0 and f'{sid} ' in j['log'] and 'FAILED' not in j['log']
            if ok:
                try:
                    b = R.worker('GET', f'/tar?path=false_floor/out/clips/{sid}.{ext}', raw=True, timeout=1800)
                    tmp = os.path.join(FF, 'out', f'.fetch_{sid}')
                    with tarfile.open(fileobj=io.BytesIO(b), mode='r:gz') as t:
                        t.extractall(tmp, filter='data')
                    src = next(p for p in glob.glob(os.path.join(tmp, '**', f'{sid}.{ext}'), recursive=True))
                    shutil.move(src, os.path.join(FF, 'out', 'clips', f'{sid}.{ext}'))
                    shutil.rmtree(tmp, ignore_errors=True)
                    st['done'][sid] = {'pod': pod, 'secs': round(time.time() - t0), 'at': time.strftime('%H:%M')}
                    log(f'DONE {sid} on {R.state().get("gpu", "")[:24]} in {time.time() - t0:.0f}s ({len(b) / 1e6:.0f} MB)')
                except Exception as e:
                    log(f'FETCH FAILED {sid}: {e}')
            else:
                log(f'RENDER FAILED {sid} rc={j["rc"]}\n{j["log"][-1500:]}')
                st['done'][sid] = {'failed': True, 'at': time.strftime('%H:%M')}
        # queue
        want = wanted()
        st.setdefault('forced_seen', [])
        for sid in {w.rstrip('!') for w in want if w.endswith('!')}:   # "S25!" = re-render once after a change
            if sid not in st['forced_seen']:
                st['forced_seen'].append(sid)
                st['done'].pop(sid, None)
        running = {v[0] for v in busy.values()}
        queue = [w.rstrip('!') for w in want]
        queue = [s for i, s in enumerate(queue) if s not in queue[:i] and s not in st['done'] and s not in running]
        queue.sort(key=lambda s: (SHOTS[s]['kind'] != '3D', -(SHOTS[s].get('render_frames') or 1)))
        for pod in read_pods():
            if pod in busy or not queue:
                continue
            sid = queue.pop(0)
            on(pod)
            try:
                R.upload(['tumbler', 'false_floor', 'gpu'])
                cmd = (f'cd /work && export TUMBLER_DEVICE=OPTIX && python3 false_floor/tools/render_shots.py {sid} --force '
                       f'--samples 40 --still-samples 96')
                jid = R.worker('POST', '/run', json.dumps({'cmd': cmd}).encode())['id']
            except Exception as e:
                log(f'START FAILED {sid} on {pod}: {e}')
                queue.insert(0, sid)
                continue
            busy[pod] = (sid, jid, time.time())
            st['running'][sid] = {'pod': pod, 'since': time.strftime('%H:%M')}
            log(f'START {sid} ({SHOTS[sid]["kind"]} {SHOTS[sid].get("render_frames")}f) on {R.state().get("gpu", "")[:24]}')
        st['queue'] = queue
        json.dump(st, open(STATUS, 'w'), indent=1)
        if '--until-empty' in sys.argv and not busy and not queue:
            log('queue empty, all pods idle')
            return
        time.sleep(20)


if __name__ == '__main__':
    main()
