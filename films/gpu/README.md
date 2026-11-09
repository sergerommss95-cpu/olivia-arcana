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
