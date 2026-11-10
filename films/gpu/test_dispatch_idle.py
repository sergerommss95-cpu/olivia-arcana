#!/usr/bin/env python3
"""Tests for the dispatcher's idle auto-terminate, against a fake RunPod (no network, no pods, no money).

    python3 films/gpu/test_dispatch_idle.py
"""
import io, json, os, shutil, sys, tarfile, tempfile, time, types

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dispatch as D
import runpod_client as R

REAL_SLEEP = time.sleep
OURS = R.POD_NAME


class Fake:
    """Stands in for the RunPod API and the in-pod workers."""

    def __init__(self, names, dead_workers=(), missing=()):
        self.names = dict(names)            # pod id -> pod name as the API reports it
        self.dead = set(dead_workers)       # pod ids whose worker never answers a job poll
        self.missing = set(missing)         # pod ids the API no longer knows (404)
        self.deleted, self.jobs, self.ticks, self.on_tick = [], {}, 0, None

    def api(self, method, path, body=None, graphql=False):
        pid = path.rsplit('/', 1)[-1]
        if pid in self.missing or pid in self.deleted:
            raise R.ApiError(404, 'RunPod API 404: {"error":"pod not found"}')
        if method == 'GET':
            return {'id': pid, 'name': self.names[pid]}
        if method == 'DELETE':
            self.deleted.append(pid)
            return {}
        raise AssertionError(f'unexpected API call {method} {path}')

    def upload(self, dirs):
        pass

    def worker(self, method, path, data=None, raw=False, timeout=120):
        pid = R.state()['pod']
        if path == '/run':
            sid = json.loads(data)['cmd'].split('render_shots.py ')[1].split()[0]
            jid = f'{pid}-{sid}'
            self.jobs[jid] = [sid, 0]
            return {'id': jid}
        if path.startswith('/job'):
            if pid in self.dead:
                raise RuntimeError('worker /job -> 000')
            job = self.jobs[path.split('id=')[1].split('&')[0]]
            job[1] += 1
            return {'rc': 0 if job[1] >= 2 else None, 'log': f'{job[0]} 3DS OK 1s'}
        if path.startswith('/tar'):
            name = path.rsplit('/', 1)[-1]
            buf = io.BytesIO()
            with tarfile.open(fileobj=buf, mode='w:gz') as t:
                info = tarfile.TarInfo(name)
                info.size = 3
                t.addfile(info, io.BytesIO(b'png'))
            return buf.getvalue()
        raise AssertionError(f'unexpected worker call {path}')

    def sleep(self, _secs):
        self.ticks += 1
        if self.on_tick:
            self.on_tick(self.ticks)
        REAL_SLEEP(0.05)


def run(pods, shots, extra_args=(), late=None, idle_minutes='0.02', **fake_kw):
    """One dispatcher run in a scratch project. pods: [(file stem, pod id, name)]. Returns (fake, log text, scratch dir)."""
    tmp = tempfile.mkdtemp(prefix='disp_test_')
    os.makedirs(os.path.join(tmp, 'notes'))
    os.makedirs(os.path.join(tmp, 'out', 'clips'))
    open(os.path.join(tmp, 'notes', 'ready_test.txt'), 'w').write(''.join(s + '\n' for s in shots))
    files = []
    for stem, pid, _name in pods:
        f = os.path.join(tmp, stem + '.json')
        json.dump({'pod': pid, 'token': 't', 'created': time.time() - 3600, 'gpu': 'FAKE GPU', 'cost_per_hr': 1.0}, open(f, 'w'))
        files.append(f)
    pods_txt = os.path.join(tmp, 'pods.txt')
    open(pods_txt, 'w').write(''.join(f + '\n' for f in files))
    fake = Fake({pid: name for _s, pid, name in pods}, **fake_kw)
    if late:                                   # (tick, shot): list one more shot while the pods sit idle
        def on_tick(n):
            if n == late[0]:
                open(os.path.join(tmp, 'notes', 'ready_test.txt'), 'a').write(late[1] + '\n')
        fake.on_tick = on_tick
    D.FF, D.STATUS, D.LOG = tmp, os.path.join(tmp, 'out', 'dispatch.json'), os.path.join(tmp, 'out', 'dispatch.log')
    D.SHOTS = {f'T0{i}': {'id': f'T0{i}', 'kind': '3DS', 'render_frames': 1} for i in range(1, 5)}
    D.time = types.SimpleNamespace(time=time.time, sleep=fake.sleep, strftime=time.strftime)
    R.api, R.upload, R.worker = fake.api, fake.upload, fake.worker
    argv = sys.argv
    sys.argv = ['dispatch.py', '--pods', pods_txt, '--until-empty', '--idle-minutes', idle_minutes, *extra_args]
    try:
        D.main()
    finally:
        sys.argv = argv
    return fake, open(D.LOG).read(), tmp


def check(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name + (f'  [{detail}]' if detail and not cond else ''))
    if not cond:
        check.failed += 1


check.failed = 0


def main():
    # 1. normal run: shots render, then every pod of ours is terminated after the idle limit
    f, log, tmp = run([('podA', 'idA', OURS), ('podB', 'idB', OURS)], ['T01', 'T02'])
    check('1 shots rendered', log.count('DONE') == 2 and os.path.exists(os.path.join(tmp, 'out', 'clips', 'T01.png')), log)
    check('1 both pods terminated when idle', sorted(f.deleted) == ['idA', 'idB'], str(f.deleted))
    check('1 state files removed, pod list emptied',
          not os.path.exists(os.path.join(tmp, 'podA.json')) and open(os.path.join(tmp, 'pods.txt')).read() == '')
    check('1 dispatcher exits with no pods left', 'no pods left' in log, log)
    check('1 nothing terminated before the work was done', log.rindex('DONE') < log.index('terminated id'), log)
    shutil.rmtree(tmp)

    # 2. a pod that is not ours (another project's name) is never deleted, even if it sits in our list
    f, log, tmp = run([('podA', 'idA', OURS), ('podG', 'idG', 'ff-ep2-coldopen-v2final')], ['T01'])
    check('2 our pod terminated', f.deleted == ['idA'], str(f.deleted))
    check('2 foreign pod refused and left running', 'REFUSED' in log and 'idG' not in f.deleted, log)
    check('2 foreign pod state file kept', os.path.exists(os.path.join(tmp, 'podG.json')))
    shutil.rmtree(tmp)

    # 3. --keep-pods: nothing is terminated, and the log says what is still costing money
    f, log, tmp = run([('podA', 'idA', OURS)], ['T01'], extra_args=['--keep-pods'])
    check('3 --keep-pods deletes nothing', f.deleted == [] and 'LEFT RUNNING' in log, log)
    shutil.rmtree(tmp)

    # 4. a shot listed while the pod waits is rendered on it, and the idle clock starts again afterwards
    f, log, tmp = run([('podA', 'idA', OURS)], ['T01'], late=(8, 'T02'), idle_minutes='0.03')
    check('4 late shot rendered on the waiting pod', 'DONE T02' in log and log.count('START') == 2, log)
    check('4 terminated only after the late shot', log.index('DONE T02') < log.index('terminated idA'), log)
    shutil.rmtree(tmp)

    # 5. a pod that stops answering: its shot goes back to the queue and the pod is terminated
    f, log, tmp = run([('podA', 'idA', OURS)], ['T01'], dead_workers=['idA'])
    check('5 unresponsive pod terminated', f.deleted == ['idA'] and 'has not answered' in log, log)
    check('5 its shot is reported as still queued', 'still queued: T01' in log, log)
    shutil.rmtree(tmp)

    # 6. a pod RunPod already removed (e.g. the balance ran out): no delete call, state cleaned up
    f, log, tmp = run([('podA', 'idA', OURS)], [], missing=['idA'])
    check('6 pod already gone: cleaned up, no delete', f.deleted == [] and 'already gone' in log
          and not os.path.exists(os.path.join(tmp, 'podA.json')), log)
    shutil.rmtree(tmp)

    print('\n%d failed' % check.failed if check.failed else '\nall passed')
    sys.exit(1 if check.failed else 0)


if __name__ == '__main__':
    main()
