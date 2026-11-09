#!/usr/bin/env python3
"""Drive a RunPod GPU pod from here: create -> wait -> upload -> run -> fetch -> terminate.

The RunPod API key is read from /root/.runpod/api_key (never from the repo). Pod state: /root/.runpod/state.json.
  python3 films/gpu/runpod_client.py create [--gpu "NVIDIA GeForce RTX 4090"] [--cloud COMMUNITY]
  python3 films/gpu/runpod_client.py wait            # until the worker answers /ping
  python3 films/gpu/runpod_client.py upload DIR [DIR...]   # tar.gz -> /work/<basename>
  python3 films/gpu/runpod_client.py run "cmd"       # prints job id
  python3 films/gpu/runpod_client.py job ID [--follow]
  python3 films/gpu/runpod_client.py fetch REMOTE_DIR LOCAL_DIR
  python3 films/gpu/runpod_client.py status | terminate | balance
"""
import base64, io, json, os, secrets, subprocess, sys, tarfile, time, urllib.request, urllib.error

KEYF = '/root/.runpod/api_key'
STATE = os.environ.get('RUNPOD_STATE', '/root/.runpod/state.json')
HERE = os.path.dirname(os.path.abspath(__file__))
IMAGE = 'runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04'


def key():
    return open(KEYF).read().strip()


def api(method, path, body=None, graphql=False):
    """RunPod API via curl (its Cloudflare front rejects Python's urllib client)."""
    url = 'https://api.runpod.io/graphql' if graphql else 'https://rest.runpod.io/v1' + path
    cfg = f'header = "Authorization: Bearer {key()}"\nheader = "Content-Type: application/json"\n'
    cmd = ['curl', '-sS', '--max-time', '60', '-X', method, url, '-K', '-', '-w', '\n%{http_code}']
    if body is not None:
        cmd += ['--data-binary', json.dumps(body)]
    r = subprocess.run(cmd, input=cfg, capture_output=True, text=True)
    txt, _, code = r.stdout.rpartition('\n')
    if not code.startswith('2'):
        raise SystemExit(f'RunPod API {code}: {txt[:800]} {r.stderr[:300]}')
    return json.loads(txt) if txt.strip() else {}


def state():
    return json.load(open(STATE)) if os.path.exists(STATE) else {}


def save(s):
    json.dump(s, open(STATE, 'w'))
    os.chmod(STATE, 0o600)


def worker(method, path, data=None, raw=False, timeout=120):
    """Call the pod's worker through RunPod's HTTPS proxy (curl; Cloudflare rejects Python's urllib)."""
    import tempfile
    s = state()
    url = f"https://{s['pod']}-8000.proxy.runpod.net{path}"
    cmd = ['curl', '-sS', '--max-time', str(timeout), '-X', method, url, '-K', '-', '-w', '%{http_code}', '-o']
    with tempfile.NamedTemporaryFile(delete=False) as out:
        outp = out.name
    cmd.append(outp)
    inp = None
    if data is not None:
        with tempfile.NamedTemporaryFile(delete=False) as f:
            f.write(data)
            inp = f.name
        cmd += ['--data-binary', '@' + inp, '-H', 'Content-Type: application/octet-stream']
    r = subprocess.run(cmd, input=f'header = "X-Token: {s["token"]}"\n', capture_output=True, text=True)
    body = open(outp, 'rb').read()
    os.remove(outp)
    if inp:
        os.remove(inp)
    code = r.stdout.strip()[-3:]
    if code != '200':
        raise RuntimeError(f'worker {path} -> {code or r.stderr.strip()[:200]} {body[:300]!r}')
    return body if raw else json.loads(body)


def create(gpu, cloud):
    if state().get('pod'):
        raise SystemExit('a pod is already recorded in state.json; terminate it first')
    tok = secrets.token_hex(16)
    agent = base64.b64encode(open(os.path.join(HERE, 'agent.py'), 'rb').read()).decode()
    start = ('apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq libxrender1 libxi6 libxkbcommon0 libsm6 '
             'libgl1 libxxf86vm1 libxfixes3 libegl1 xz-utils ffmpeg >/tmp/apt.log 2>&1; '
             'echo $AGENT_B64 | base64 -d > /agent.py && python3 /agent.py')
    body = {'name': 'false-floor-render', 'imageName': IMAGE, 'gpuTypeIds': [g.strip() for g in gpu.split(',')], 'gpuCount': 1, 'cloudType': cloud,
            'containerDiskInGb': 40, 'volumeInGb': 0, 'ports': ['8000/http'],
            'env': {'AGENT_TOKEN': tok, 'AGENT_B64': agent, 'NVIDIA_DRIVER_CAPABILITIES': 'all'},
            'dockerStartCmd': ['bash', '-c', start]}
    r = api('POST', '/pods', body)
    save({'pod': r['id'], 'token': tok, 'created': time.time(), 'gpu': gpu, 'cost_per_hr': r.get('costPerHr')})
    print(json.dumps({'pod': r['id'], 'costPerHr': r.get('costPerHr'), 'machine': r.get('machine', {}).get('gpuDisplayName')}))


def wait(limit=900):
    t0 = time.time()
    while time.time() - t0 < limit:
        try:
            print(json.dumps(worker('GET', '/ping', timeout=15)))
            return
        except Exception:
            time.sleep(10)
    raise SystemExit('worker did not come up')


def upload(dirs):
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode='w:gz') as t:
        for d in dirs:
            t.add(d, arcname=os.path.basename(os.path.normpath(d)),
                  filter=lambda ti: None if any(x in ti.name for x in ('/out', '/tests', '/audio', '/assets_private', '__pycache__', '.mp4', '.wav', '/blend')) else ti)
    print(worker('POST', '/upload', buf.getvalue(), timeout=600), f'{len(buf.getvalue()) / 1e6:.1f} MB')


def job(jid, follow=False):
    while True:
        j = worker('GET', f'/job?id={jid}&tail=4000')
        if not follow or j['rc'] is not None:
            print(j['log'])
            print('rc', j['rc'])
            return j['rc']
        time.sleep(15)


def fetch(remote, local):
    b = worker('GET', f'/tar?path={remote}', raw=True, timeout=1800)
    os.makedirs(local, exist_ok=True)
    with tarfile.open(fileobj=io.BytesIO(b), mode='r:gz') as t:
        t.extractall(local, filter='data')
    print('fetched', f'{len(b) / 1e6:.1f} MB', '->', local)


def terminate():
    s = state()
    if not s.get('pod'):
        print('no pod recorded')
        return
    api('DELETE', f"/pods/{s['pod']}")
    hrs = (time.time() - s['created']) / 3600
    print(f"terminated {s['pod']} after {hrs * 60:.1f} min (~${hrs * (s.get('cost_per_hr') or 0):.2f})")
    os.remove(STATE)


if __name__ == '__main__':
    a = sys.argv[1:]
    cmd = a[0] if a else 'status'
    opt = lambda n, d: a[a.index(n) + 1] if n in a else d
    if cmd == 'create':
        create(opt('--gpu', 'NVIDIA GeForce RTX 4090'), opt('--cloud', 'COMMUNITY'))
    elif cmd == 'wait':
        wait()
    elif cmd == 'upload':
        upload([x for x in a[1:] if not x.startswith('--')])
    elif cmd == 'run':
        print(worker('POST', '/run', json.dumps({'cmd': a[1]}).encode())['id'])
    elif cmd == 'job':
        job(a[1], '--follow' in a)
    elif cmd == 'fetch':
        fetch(a[1], a[2])
    elif cmd == 'terminate':
        terminate()
    elif cmd == 'balance':
        print(api('POST', '', {'query': '{ myself { clientBalance currentSpendPerHr } }'}, graphql=True))
    else:
        s = state()
        print(json.dumps({k: v for k, v in s.items() if k != 'token'}))
        if s.get('pod'):
            r = api('GET', f"/pods/{s['pod']}")
            print(json.dumps({k: r.get(k) for k in ('id', 'desiredStatus', 'costPerHr', 'lastStatusChange')}))
