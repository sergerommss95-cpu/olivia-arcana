"""
ALTERNATIVE Step 4: Generate videos using Remotion (React-based video renderer).

Remotion produces MUCH higher quality videos than FFmpeg:
- React components as video frames
- CSS animations, SVG, Canvas, WebGL
- Proper text animations (word-by-word reveal)
- Smooth transitions and effects
- Professional-grade output

Setup:
  cd ~/olivia-arcana/social-pipeline/remotion-video
  npm install
  npx remotion render ZodiacDaily --props='{"sign":"Aries","hook":"...","body":"..."}' --output=out.mp4

This script wraps the Remotion CLI to batch-render videos from the pipeline.
"""
import asyncio
import json
import subprocess
from pathlib import Path
from datetime import date

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config.settings import OUTPUT_DIR, ZODIAC_SIGNS

REMOTION_DIR = Path(__file__).resolve().parent.parent / "remotion-video"


def _check_remotion() -> bool:
    """Check if Remotion project exists and is set up."""
    package_json = REMOTION_DIR / "package.json"
    if not package_json.exists():
        print(f"Remotion project not found at {REMOTION_DIR}")
        print("Run: cd social-pipeline && npx create-video@latest remotion-video")
        return False
    return True


async def render_zodiac_video_remotion(
    sign_name: str,
    glyph: str,
    element: str,
    hook: str,
    body: str,
    cta: str,
    audio_path: Path | None,
    output_path: Path,
) -> Path:
    """Render a single zodiac video using Remotion."""
    if not _check_remotion():
        print(f"  [remotion] SKIP: project not set up")
        return output_path

    props = json.dumps({
        "sign": sign_name,
        "glyph": glyph,
        "element": element,
        "hook": hook,
        "body": body,
        "cta": cta,
        "audioSrc": str(audio_path) if audio_path and audio_path.exists() else None,
    })

    output_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "npx", "remotion", "render",
        "ZodiacDaily",
        f"--props={props}",
        f"--output={output_path}",
        "--codec=h264",
        "--image-format=jpeg",
        "--scale=1",
    ]

    print(f"  [remotion] Rendering {sign_name}...")
    result = subprocess.run(
        cmd,
        cwd=str(REMOTION_DIR),
        capture_output=True,
        text=True,
        timeout=120,
    )

    if result.returncode == 0 and output_path.exists():
        size_mb = output_path.stat().st_size / (1024 * 1024)
        print(f"  [remotion] {output_path.name} ({size_mb:.1f}MB)")
    else:
        print(f"  [remotion] ERROR: {result.stderr[-300:]}")

    return output_path


async def render_all_daily_remotion(
    tiktok_scripts: list,
    audio_files: list[Path],
    date_str: str,
) -> list[Path]:
    """Render all 12 daily zodiac videos with Remotion."""
    day_dir = OUTPUT_DIR / date_str / "videos"
    day_dir.mkdir(parents=True, exist_ok=True)

    sign_lookup = {s["name"]: s for s in ZODIAC_SIGNS}
    videos = []

    for i, script in enumerate(tiktok_scripts):
        sign_name = script.get("sign", "Unknown")
        sign_info = sign_lookup.get(sign_name, ZODIAC_SIGNS[0])

        audio_path = audio_files[i] if i < len(audio_files) else None
        output_path = day_dir / f"{sign_name.lower()}_daily.mp4"

        await render_zodiac_video_remotion(
            sign_name=sign_name,
            glyph=sign_info["glyph"],
            element=sign_info["element"],
            hook=script.get("hook", ""),
            body=script.get("body", ""),
            cta=script.get("cta", ""),
            audio_path=audio_path,
            output_path=output_path,
        )
        videos.append(output_path)

    return videos


# ─── Remotion Project Scaffolding ────────────────────────────────────────────

REMOTION_PACKAGE_JSON = """{
  "name": "olivia-arcana-video",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "npx remotion studio",
    "render": "npx remotion render",
    "render-all": "node scripts/render-batch.mjs"
  },
  "dependencies": {
    "@remotion/cli": "^4.0.0",
    "@remotion/player": "^4.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "remotion": "^4.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "typescript": "^5.0.0"
  }
}"""

REMOTION_ROOT = """import {Composition} from 'remotion';
import {ZodiacDaily} from './compositions/ZodiacDaily';
import {ZodiacRoast} from './compositions/ZodiacRoast';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ZodiacDaily"
        component={ZodiacDaily}
        durationInFrames={600} // 20 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          sign: 'Aries',
          glyph: '♈',
          element: 'fire',
          hook: 'If you are an Aries, the stars have something urgent...',
          body: 'Mars is activating your chart today...',
          cta: 'Follow for your daily reading.',
          audioSrc: null,
        }}
      />
      <Composition
        id="ZodiacRoast"
        component={ZodiacRoast}
        durationInFrames={900} // 30 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          sign: 'Gemini',
          glyph: '♊',
          hook: 'Oh, Gemini. We need to talk.',
          roastLines: ['Line 1', 'Line 2', 'Line 3'],
          redemption: 'But you are also wonderful.',
          cta: 'Link in bio.',
        }}
      />
    </>
  );
};
"""

ZODIAC_DAILY_COMPONENT = """import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Audio,
  staticFile,
} from 'remotion';

// Celestial Noir palette
const COLORS = {
  voidBlack: '#0D0D1A',
  deepCosmos: '#1A1A3E',
  celestialGold: '#D4AF37',
  slateBlue: '#7B68EE',
  warmIvory: '#F5F0E8',
  mutedLavender: '#9B96A8',
};

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#E8524A',
  earth: '#4ECDC4',
  air: '#7B68EE',
  water: '#5B8DEF',
};

interface Props {
  sign: string;
  glyph: string;
  element: string;
  hook: string;
  body: string;
  cta: string;
  audioSrc: string | null;
}

export const ZodiacDaily: React.FC<Props> = ({
  sign, glyph, element, hook, body, cta, audioSrc,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const elementColor = ELEMENT_COLORS[element] || COLORS.celestialGold;

  // Animation keyframes
  const glyphScale = spring({fps, frame, config: {damping: 15, stiffness: 80}});
  const glyphOpacity = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});

  const signOpacity = interpolate(frame, [10, 25], [0, 1], {extrapolateRight: 'clamp'});
  const signY = interpolate(frame, [10, 25], [30, 0], {extrapolateRight: 'clamp'});

  // Caption timing
  const fullText = `${hook} ${body} ${cta}`;
  const words = fullText.split(' ');
  const wordsPerFrame = words.length / (durationInFrames - 60); // Leave 2s buffer
  const captionGroups: {text: string; startFrame: number; endFrame: number}[] = [];
  let wordIdx = 0;
  while (wordIdx < words.length) {
    const groupSize = words[wordIdx].length < 5 ? 3 : 2;
    const group = words.slice(wordIdx, wordIdx + groupSize).join(' ');
    const startFrame = Math.floor(30 + (wordIdx / wordsPerFrame));
    const endFrame = Math.floor(30 + ((wordIdx + groupSize) / wordsPerFrame));
    captionGroups.push({text: group, startFrame, endFrame});
    wordIdx += groupSize;
  }

  // Current caption
  const currentCaption = captionGroups.find(
    (c) => frame >= c.startFrame && frame < c.endFrame
  );

  // Divider animation
  const dividerWidth = interpolate(frame, [20, 40], [0, 500], {extrapolateRight: 'clamp'});

  // Star particles
  const stars = Array.from({length: 40}, (_, i) => ({
    x: (Math.sin(i * 137.508) * 0.5 + 0.5) * 1080,
    y: (Math.cos(i * 137.508 * 0.7) * 0.5 + 0.5) * 1920,
    size: 1 + (i % 3),
    twinkle: Math.sin(frame * 0.05 + i * 2) * 0.5 + 0.5,
  }));

  // Watermark fade
  const watermarkOpacity = interpolate(
    frame,
    [durationInFrames - 90, durationInFrames - 60],
    [0, 0.5],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  return (
    <AbsoluteFill>
      {/* Background gradient */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(170deg, ${COLORS.voidBlack} 0%, ${COLORS.deepCosmos} 100%)`,
        }}
      />

      {/* Star particles */}
      {stars.map((star, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            backgroundColor: COLORS.warmIvory,
            opacity: star.twinkle * 0.4,
          }}
        />
      ))}

      {/* Gold border */}
      <div
        style={{
          position: 'absolute',
          inset: 20,
          border: `1px solid ${COLORS.celestialGold}30`,
          borderRadius: 0,
        }}
      />

      {/* "DAILY HOROSCOPE" label */}
      <div
        style={{
          position: 'absolute',
          top: 160,
          width: '100%',
          textAlign: 'center',
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 20,
          letterSpacing: 4,
          color: COLORS.celestialGold,
          opacity: interpolate(frame, [5, 15], [0, 1], {extrapolateRight: 'clamp'}),
        }}
      >
        DAILY HOROSCOPE
      </div>

      {/* Zodiac glyph */}
      <div
        style={{
          position: 'absolute',
          top: 280,
          width: '100%',
          textAlign: 'center',
          fontSize: 200,
          color: elementColor,
          opacity: glyphOpacity,
          transform: `scale(${glyphScale})`,
        }}
      >
        {glyph}
      </div>

      {/* Sign name */}
      <div
        style={{
          position: 'absolute',
          top: 560,
          width: '100%',
          textAlign: 'center',
          fontFamily: 'Playfair Display, serif',
          fontSize: 52,
          fontWeight: 700,
          color: COLORS.celestialGold,
          opacity: signOpacity,
          transform: `translateY(${signY}px)`,
        }}
      >
        {sign.toUpperCase()}
      </div>

      {/* Gold divider */}
      <div
        style={{
          position: 'absolute',
          top: 640,
          left: (1080 - dividerWidth) / 2,
          width: dividerWidth,
          height: 1,
          backgroundColor: COLORS.celestialGold,
        }}
      />

      {/* Animated captions */}
      {currentCaption && (
        <div
          style={{
            position: 'absolute',
            top: 1380,
            width: '100%',
            textAlign: 'center',
            padding: '0 60px',
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 64,
              fontWeight: 700,
              color: 'white',
              textShadow: '2px 2px 8px rgba(0,0,0,0.8), -1px -1px 4px rgba(0,0,0,0.6)',
              lineHeight: 1.2,
            }}
          >
            {currentCaption.text}
          </span>
        </div>
      )}

      {/* Watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          right: 30,
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 18,
          letterSpacing: 3,
          color: COLORS.celestialGold,
          opacity: watermarkOpacity,
        }}
      >
        OLIVIA ARCANA
      </div>

      {/* Audio */}
      {audioSrc && <Audio src={audioSrc} startFrom={30} />}
    </AbsoluteFill>
  );
};
"""

ZODIAC_ROAST_COMPONENT = """import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
} from 'remotion';

const COLORS = {
  voidBlack: '#0D0D1A',
  deepCosmos: '#1A1A3E',
  celestialGold: '#D4AF37',
  marsRed: '#E8524A',
  warmIvory: '#F5F0E8',
};

interface Props {
  sign: string;
  glyph: string;
  hook: string;
  roastLines: string[];
  redemption: string;
  cta: string;
}

export const ZodiacRoast: React.FC<Props> = ({
  sign, glyph, hook, roastLines, redemption, cta,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const sections = [hook, ...roastLines, redemption, cta];
  const framesPerSection = Math.floor(durationInFrames / sections.length);

  const currentSectionIdx = Math.min(
    Math.floor(frame / framesPerSection),
    sections.length - 1
  );
  const currentText = sections[currentSectionIdx];

  const sectionFrame = frame - currentSectionIdx * framesPerSection;
  const textOpacity = interpolate(sectionFrame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
  const textY = interpolate(sectionFrame, [0, 10], [20, 0], {extrapolateRight: 'clamp'});

  const isRoast = currentSectionIdx >= 1 && currentSectionIdx <= roastLines.length;
  const isRedemption = currentSectionIdx === roastLines.length + 1;
  const textColor = isRoast ? COLORS.marsRed : isRedemption ? COLORS.celestialGold : COLORS.warmIvory;

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(170deg, ${COLORS.voidBlack} 0%, ${COLORS.deepCosmos} 100%)`,
    }}>
      {/* Glyph */}
      <div style={{
        position: 'absolute', top: 300, width: '100%', textAlign: 'center',
        fontSize: 180, color: COLORS.marsRed, opacity: 0.3,
      }}>
        {glyph}
      </div>

      {/* Current text */}
      <div style={{
        position: 'absolute', top: '45%', width: '100%', textAlign: 'center',
        padding: '0 80px',
        opacity: textOpacity,
        transform: \`translateY(\${textY}px)\`,
      }}>
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 48,
          fontWeight: 600,
          color: textColor,
          lineHeight: 1.4,
          textShadow: '2px 2px 8px rgba(0,0,0,0.6)',
        }}>
          {currentText}
        </span>
      </div>

      {/* Watermark */}
      <div style={{
        position: 'absolute', bottom: 50, width: '100%', textAlign: 'center',
        fontFamily: 'Cormorant Garamond, serif', fontSize: 18,
        letterSpacing: 3, color: COLORS.celestialGold, opacity: 0.5,
      }}>
        OLIVIA ARCANA
      </div>
    </AbsoluteFill>
  );
};
"""


def scaffold_remotion_project():
    """Create the Remotion video project if it doesn't exist."""
    if REMOTION_DIR.exists():
        print(f"Remotion project already exists at {REMOTION_DIR}")
        return

    print(f"Creating Remotion project at {REMOTION_DIR}...")
    REMOTION_DIR.mkdir(parents=True)

    # package.json
    (REMOTION_DIR / "package.json").write_text(REMOTION_PACKAGE_JSON)

    # Source files
    src_dir = REMOTION_DIR / "src"
    src_dir.mkdir()
    comp_dir = src_dir / "compositions"
    comp_dir.mkdir()

    (src_dir / "Root.tsx").write_text(REMOTION_ROOT)
    (comp_dir / "ZodiacDaily.tsx").write_text(ZODIAC_DAILY_COMPONENT)
    (comp_dir / "ZodiacRoast.tsx").write_text(ZODIAC_ROAST_COMPONENT)

    # remotion.config.ts
    (REMOTION_DIR / "remotion.config.ts").write_text(
        'import {Config} from "@remotion/cli/config";\n'
        'Config.setVideoImageFormat("jpeg");\n'
    )

    # tsconfig.json
    (REMOTION_DIR / "tsconfig.json").write_text(json.dumps({
        "compilerOptions": {
            "target": "ES2022",
            "module": "ES2022",
            "moduleResolution": "bundler",
            "jsx": "react-jsx",
            "strict": True,
            "skipLibCheck": True,
            "esModuleInterop": True,
        },
        "include": ["src/**/*.ts", "src/**/*.tsx"],
    }, indent=2))

    print(f"Remotion project scaffolded. Run: cd {REMOTION_DIR} && npm install")


if __name__ == "__main__":
    scaffold_remotion_project()
