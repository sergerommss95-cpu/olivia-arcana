#!/usr/bin/env python3
"""Run a shot script in headless Blender behind a global file lock (one render at a time).

    python3 tools/rb.py shots/act1_lock.py -- --shot 1A --stills 1,24 --pct 50
Environment: BLENDER (default: blender on PATH). Logs go to out/logs/.
"""
import fcntl, os, subprocess, sys, time

FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCK = os.environ.get('TUMBLER_LOCK', '/tmp/tumbler_render.lock')
BLENDER = os.environ.get('BLENDER', 'blender')


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    script = os.path.abspath(sys.argv[1])
    rest = sys.argv[2:]
    os.makedirs(os.path.join(FILM, 'out', 'logs'), exist_ok=True)
    tag = os.path.basename(script).replace('.py', '') + '_' + '_'.join(a.strip('-') for a in rest if a != '--')[:60]
    log = os.path.join(FILM, 'out', 'logs', tag.replace('/', '_').replace(',', '-') + '.log')
    with open(LOCK, 'w') as lf:
        t0 = time.time()
        fcntl.flock(lf, fcntl.LOCK_EX)
        waited = time.time() - t0
        if waited > 1:
            print(f'[rb] waited {waited:.0f}s for lock', flush=True)
        cmd = [BLENDER, '-b', '--factory-startup', '-noaudio', '--python-exit-code', '1', '-P', script] + rest
        t1 = time.time()
        with open(log, 'w') as lg:
            p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=FILM)
            for line in p.stdout:
                lg.write(line)
                if line.startswith(('[still]', '[frame]', '[anim]', '[info]', 'Traceback', 'Error', '  File', 'RuntimeError',
                                    'KeyError', 'AttributeError', 'TypeError', 'ValueError', 'NameError', 'IndexError')) \
                        or 'Error:' in line:
                    print(line.rstrip(), flush=True)
            p.wait()
        print(f'[rb] exit {p.returncode} in {time.time() - t1:.0f}s  log: {log}', flush=True)
        sys.exit(p.returncode)


if __name__ == '__main__':
    main()
