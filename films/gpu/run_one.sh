#!/bin/bash
# usage: films/gpu/run_one.sh /root/.runpod/podN.json SHOT   -> force-renders one shot on that pod and fetches its clip
set -e
cd "$(dirname "$0")/.."
export RUNPOD_STATE=$1
SHOT=$2
C="python3 gpu/runpod_client.py"
$C upload tumbler false_floor gpu >/dev/null
J=$(python3 -c "
import sys, json; sys.path.insert(0, 'gpu'); import runpod_client as R
print(R.worker('POST', '/run', json.dumps({'cmd': 'cd /work && export TUMBLER_DEVICE=OPTIX && python3 false_floor/tools/render_shots.py $SHOT --force --samples 40 --still-samples 96'}).encode())['id'])")
while true; do out=$($C job $J 2>&1); if ! echo "$out" | grep -q "^rc None"; then break; fi; sleep 20; done
echo "$out" | grep -E "^$SHOT|rc"
python3 -c "
import sys, io, tarfile, glob, shutil, os; sys.path.insert(0, 'gpu'); import runpod_client as R
b = R.worker('GET', '/tar?path=false_floor/out/clips/$SHOT.mkv', raw=True, timeout=1800)
t = 'false_floor/out/.fetch_$SHOT'
tarfile.open(fileobj=io.BytesIO(b), mode='r:gz').extractall(t, filter='data')
src = glob.glob(t + '/**/$SHOT.mkv', recursive=True)[0]
shutil.move(src, 'false_floor/out/clips/$SHOT.mkv'); shutil.rmtree(t)
print('fetched $SHOT', len(b))"
