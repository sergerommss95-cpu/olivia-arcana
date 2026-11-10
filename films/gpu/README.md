# GPU rendering on RunPod

`runpod_client.py` rents a pod, `agent.py` runs inside it (tiny token-protected HTTP worker), `pod_setup.sh` installs
Blender 5.2.3 there. The RunPod API key lives in `/root/.runpod/api_key` (outside the repo); pod state in
`/root/.runpod/state.json`. Cycles uses the GPU when `TUMBLER_DEVICE=OPTIX` (or `CUDA`) is set (see `tumbler/lib/common.py`).

```bash
python3 films/gpu/runpod_client.py create --gpu "NVIDIA GeForce RTX 4090,NVIDIA GeForce RTX 5090,NVIDIA A40" --cloud SECURE
python3 films/gpu/runpod_client.py wait
python3 films/gpu/runpod_client.py upload films/tumbler films/gpu
python3 films/gpu/runpod_client.py run "bash /work/gpu/pod_setup.sh"
python3 films/gpu/runpod_client.py run "cd /work/tumbler && TUMBLER_DEVICE=OPTIX python3 tools/render_queue.py 2C"
python3 films/gpu/runpod_client.py fetch tumbler/out/renders local_dir
python3 films/gpu/runpod_client.py terminate      # always: billing runs until the pod is deleted
```

Pilot (9 Nov 2026, NVIDIA A40, $0.59/h, 12.5 min, $0.09): OptiX works in the container. Per frame:
2C vault push 58 s on the 4-core CPU box → 5.9 s on the A40 at the same settings; at final quality (1920×804, 64 samples)
2C 9.4 s, 1A 5.5 s, 3A 6.7 s. An RTX 4090/5090 should be roughly 2× faster than the A40.
RunPod's Cloudflare front rejects Python's urllib, so the client uses curl.

## Idle pods are terminated automatically

On 9-10 Nov 2026 four render pods sat idle for 8 hours after their queue emptied (about $30; with the idle gaps
before that, $42 of the $55 they cost) until the balance ran out. Since then `dispatch.py` lets a pod go as soon as
it has run nothing for 15 minutes (`--idle-minutes N`): after the queue empties, when its starts keep failing, or
when it stops answering (its shot goes back to the queue). List more shots within those 15 minutes and they render
on the same pods. `--keep-pods` turns this off and logs what is left running and its cost per hour.

`runpod_client.terminate()` deletes only pods named `claude-false-floor-render` (the name `create` gives them). The
RunPod account is shared with other work; a pod with any other name is refused and left as it is.

Not covered: if the session that runs the dispatcher dies, nothing watches the pods. Check
`python3 films/gpu/runpod_client.py balance` (it shows the current spend per hour) when coming back to a session.

    python3 films/gpu/test_dispatch_idle.py      # the rules above, against a fake RunPod (no network, no cost)

