#!/usr/bin/env python3
"""Build the finished film: edit/grade (tools/edit.py) -> mix + mux (tools/mix.py) -> out/TUMBLER.mp4 (+ a phone copy)."""
import os, subprocess, sys
FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
py = sys.executable
subprocess.run([py, os.path.join(FILM, 'tools', 'edit.py')], check=True)
subprocess.run([py, os.path.join(FILM, 'tools', 'mix.py')], check=True)
src = os.path.join(FILM, 'out', 'TUMBLER.mp4')
phone = os.path.join(FILM, 'out', 'TUMBLER_phone.mp4')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', 'scale=1280:720:flags=lanczos', '-c:v', 'libx264', '-crf', '22',
                '-preset', 'slow', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', phone], check=True)
print('[assemble] done:', src, phone)
