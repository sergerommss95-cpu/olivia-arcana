#!/bin/bash
# Runs on the pod: install Blender 5.2.3 (same build as the dev box) and report the GPU devices Cycles sees.
set -e
cd /opt
if [ ! -x /opt/blender/blender ]; then
  curl -sS -fL -o b.tar.xz https://download.blender.org/release/Blender5.2/blender-5.2.3-linux-x64.tar.xz
  tar -xf b.tar.xz && rm b.tar.xz && mv blender-5.2.3-linux-x64 blender
fi
ln -sf /opt/blender/blender /usr/local/bin/blender
blender --version | head -1
nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
for dev in OPTIX CUDA; do
  blender -b --factory-startup -noaudio --python-expr "
import bpy
p = bpy.context.preferences.addons['cycles'].preferences
p.compute_device_type = '$dev'
p.get_devices()
print('DEVICES $dev', [d.name for d in p.devices if d.type == '$dev'])" 2>&1 | grep DEVICES || true
done
