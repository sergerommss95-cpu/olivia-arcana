#!/bin/bash
# usage: RUNPOD_STATE=/root/.runpod/podN.json films/gpu/pod_go.sh setup | render S00 S01 ... | fetch
cd /home/user/olivia-arcana/films
C="python3 gpu/runpod_client.py"
waitjob() { # poll a worker job until it ends; print the tail
  while true; do out=$($C job "$1" 2>&1); if ! echo "$out" | grep -q "^rc None"; then echo "$out" | tail -25; break; fi; sleep 20; done; }
case "$1" in
  setup)
    $C wait && $C upload tumbler false_floor gpu && J=$($C run "bash /work/gpu/pod_setup.sh") && waitjob $J ;;
  render)
    shift
    $C upload tumbler false_floor gpu >/dev/null
    J=$($C run "cd /work && export TUMBLER_DEVICE=OPTIX && python3 false_floor/tools/render_shots.py $* --samples 40 --still-samples 96")
    waitjob $J ;;
  fetch)
    $C fetch false_floor/out/clips /tmp/ffclips_$$ && mkdir -p false_floor/out/clips && cp -n /tmp/ffclips_$$/clips/* false_floor/out/clips/ && rm -rf /tmp/ffclips_$$ && ls false_floor/out/clips ;;
esac
