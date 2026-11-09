#!/bin/bash
# Data files only (no add-on code is installed or run): MakeHuman CC0 base mesh, shape targets, CMU-compatible rig +
# skin weights (from the MPFB 2.0.18 package, sha256-pinned) and the MakeHuman CC0 system assets (clothes, hair,
# eyebrows). Used by films/false_floor/lib/human.py. CMU mocap files are fetched on demand by lib/mocap.py.
set -e
cd "$(dirname "$0")"
D=makehuman_data
[ -f $D/base.obj ] && [ -d $D/assets/clothes ] && exit 0
mkdir -p $D/rigs $D/assets tmp
curl -sSL -o tmp/mpfb.zip "https://extensions.blender.org/download/sha256:c075b3e9b94b8e5556a5f03f4653602d02ea306de08126e8f55ed6dee28a2dad/add-on-mpfb-v2.0.18.zip"
echo "c075b3e9b94b8e5556a5f03f4653602d02ea306de08126e8f55ed6dee28a2dad  tmp/mpfb.zip" | sha256sum -c -
unzip -q -o tmp/mpfb.zip 'data/3dobjs/base.obj' 'data/rigs/standard/rig.cmu_mb.json' 'data/rigs/standard/weights.cmu_mb.json' 'data/targets/*' -d tmp/mpfb
cp tmp/mpfb/data/3dobjs/base.obj $D/
cp tmp/mpfb/data/rigs/standard/rig.cmu_mb.json tmp/mpfb/data/rigs/standard/weights.cmu_mb.json $D/rigs/
cp -r tmp/mpfb/data/targets $D/
curl -sSL -o tmp/sys.zip https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip
(cd $D/assets && unzip -q -o ../../tmp/sys.zip 'clothes/*' 'hair/short*' 'eyebrows/eyebrow001/*' 'eyebrows/eyebrow003/*' 'eyes/*')
rm -rf tmp
