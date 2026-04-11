/**
 * chart-card-renderer.ts — Canvas-based shareable chart card generator
 *
 * Renders beautiful branded natal chart summary cards for social media:
 *   - Instagram Post: 1080x1080
 *   - Instagram Story / TikTok: 1080x1920
 *   - Twitter / OG: 1200x628
 *
 * Pure Canvas 2D — no html2canvas dependency. Fast, reliable, pixel-perfect.
 */

export type CardFormat = "square" | "story" | "twitter";

interface CardData {
  signName: string;
  signGlyph: string;
  bigThree: string; // "Sun in Aries, Moon in Pisces, Gemini Rising"
  element: string;
  elementEmoji: string;
  cosmicEnergy: number; // 0-100
  horoscope: string;
  luckyColor: string;
  luckyColorHex: string;
  dateRange: string;
  traits: string[];
}

const FORMAT_SIZES: Record<CardFormat, { w: number; h: number }> = {
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
  twitter: { w: 1200, h: 628 },
};

const ELEMENT_GRADIENTS: Record<string, [string, string, string]> = {
  Fire: ["#1a0a00", "#2d1200", "#0d0615"],
  Water: ["#000a1a", "#001030", "#0d0615"],
  Air: ["#0a0a14", "#12122a", "#0d0615"],
  Earth: ["#0a1005", "#0d1a08", "#0d0615"],
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderChartCard(data: CardData, format: CardFormat): Promise<Blob> {
  const { w, h } = FORMAT_SIZES[format];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Await font loading
  await document.fonts.ready;

  const scale = w / 1080; // normalize to 1080 base
  const isWide = format === "twitter";
  const isTall = format === "story";

  // ── Background gradient ──
  const colors = ELEMENT_GRADIENTS[data.element] || ELEMENT_GRADIENTS.Air;
  const grad = ctx.createLinearGradient(0, 0, w * 0.3, h);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(0.5, colors[1]);
  grad.addColorStop(1, colors[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // ── Subtle star field ──
  const starCount = isTall ? 120 : 60;
  for (let i = 0; i < starCount; i++) {
    const sx = Math.abs(((i * 2654435761) | 0) % w);
    const sy = Math.abs(((i * 340573321) | 0) % h);
    const sr = 0.3 + (i % 5) * 0.25;
    const alpha = 0.15 + (i % 7) * 0.05;
    ctx.beginPath();
    ctx.arc(sx, sy, sr * scale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,190,240,${alpha})`;
    ctx.fill();
  }

  // ── Radial glow behind glyph ──
  const glyphY = isTall ? h * 0.18 : isWide ? h * 0.45 : h * 0.22;
  const glyphX = isWide ? w * 0.22 : w * 0.5;
  const glowRad = ctx.createRadialGradient(glyphX, glyphY, 0, glyphX, glyphY, 200 * scale);
  glowRad.addColorStop(0, `${data.luckyColorHex}18`);
  glowRad.addColorStop(1, "transparent");
  ctx.fillStyle = glowRad;
  ctx.fillRect(0, 0, w, h);

  // ── Sign Glyph ──
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${(isWide ? 100 : 130) * scale}px serif`;
  ctx.fillStyle = `${data.luckyColorHex}55`;
  ctx.fillText(data.signGlyph, glyphX, glyphY);

  // ── Sign Name ──
  const nameY = glyphY + (isWide ? 70 : 90) * scale;
  ctx.font = `300 ${(isWide ? 44 : 52) * scale}px 'Cormorant Garamond', Georgia, serif`;
  ctx.fillStyle = "rgba(240,236,255,0.92)";
  ctx.letterSpacing = `${6 * scale}px`;
  ctx.fillText(data.signName.toUpperCase(), isWide ? glyphX : w / 2, nameY);
  ctx.letterSpacing = "0px";

  // ── Date Range ──
  const rangeY = nameY + 30 * scale;
  ctx.font = `400 ${12 * scale}px 'Inter', system-ui, sans-serif`;
  ctx.fillStyle = "rgba(180,170,210,0.45)";
  ctx.letterSpacing = `${3 * scale}px`;
  ctx.fillText(data.dateRange.toUpperCase(), isWide ? glyphX : w / 2, rangeY);
  ctx.letterSpacing = "0px";

  // ── Divider ──
  const divY = rangeY + 30 * scale;
  const divW = 60 * scale;
  ctx.beginPath();
  ctx.moveTo((isWide ? glyphX : w / 2) - divW, divY);
  ctx.lineTo((isWide ? glyphX : w / 2) + divW, divY);
  ctx.strokeStyle = "rgba(212,175,55,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Content area ──
  const contentX = isWide ? w * 0.48 : w * 0.12;
  const contentW = isWide ? w * 0.48 : w * 0.76;
  let cursorY = isWide ? h * 0.12 : divY + 40 * scale;

  // Big Three
  ctx.textAlign = isWide ? "left" : "center";
  ctx.font = `500 ${11 * scale}px 'Inter', system-ui, sans-serif`;
  ctx.fillStyle = "rgba(212,175,55,0.6)";
  ctx.letterSpacing = `${2.5 * scale}px`;
  ctx.fillText("YOUR BIG THREE", isWide ? contentX : w / 2, cursorY);
  ctx.letterSpacing = "0px";
  cursorY += 28 * scale;

  ctx.font = `400 ${(isWide ? 18 : 20) * scale}px 'Cormorant Garamond', Georgia, serif`;
  ctx.fillStyle = "rgba(240,236,255,0.85)";
  const bigThreeLines = wrapText(ctx, data.bigThree, contentW, 28 * scale);
  for (const line of bigThreeLines) {
    ctx.fillText(line, isWide ? contentX + contentW / 2 : w / 2, cursorY);
    cursorY += 28 * scale;
  }

  cursorY += 20 * scale;

  // Element + Energy row
  ctx.font = `500 ${11 * scale}px 'Inter', system-ui, sans-serif`;
  ctx.fillStyle = "rgba(212,175,55,0.6)";
  ctx.letterSpacing = `${2.5 * scale}px`;
  ctx.fillText("ELEMENT", isWide ? contentX : w * 0.3, cursorY);
  ctx.fillText("COSMIC ENERGY", isWide ? contentX + contentW * 0.5 : w * 0.7, cursorY);
  ctx.letterSpacing = "0px";
  cursorY += 24 * scale;

  ctx.font = `400 ${16 * scale}px 'Cormorant Garamond', Georgia, serif`;
  ctx.fillStyle = "rgba(240,236,255,0.85)";
  ctx.fillText(`${data.elementEmoji} ${data.element}`, isWide ? contentX : w * 0.3, cursorY);
  ctx.fillText(`${data.cosmicEnergy}%`, isWide ? contentX + contentW * 0.5 : w * 0.7, cursorY);

  // Energy bar
  cursorY += 18 * scale;
  const barX = isWide ? contentX + contentW * 0.35 : w * 0.55;
  const barW = isWide ? contentW * 0.28 : w * 0.28;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  ctx.roundRect(barX, cursorY - 3 * scale, barW, 6 * scale, 3 * scale);
  ctx.fill();
  ctx.fillStyle = data.luckyColorHex;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.roundRect(barX, cursorY - 3 * scale, barW * (data.cosmicEnergy / 100), 6 * scale, 3 * scale);
  ctx.fill();
  ctx.globalAlpha = 1;

  cursorY += 35 * scale;

  // Traits (if space)
  if (!isWide || isTall) {
    ctx.font = `500 ${11 * scale}px 'Inter', system-ui, sans-serif`;
    ctx.fillStyle = "rgba(212,175,55,0.6)";
    ctx.letterSpacing = `${2.5 * scale}px`;
    ctx.fillText("COSMIC TRAITS", isWide ? contentX : w / 2, cursorY);
    ctx.letterSpacing = "0px";
    cursorY += 22 * scale;

    ctx.font = `300 ${14 * scale}px 'Inter', system-ui, sans-serif`;
    ctx.fillStyle = "rgba(200,190,235,0.7)";
    const maxTraits = isTall ? 4 : 3;
    for (let i = 0; i < Math.min(data.traits.length, maxTraits); i++) {
      const traitLines = wrapText(ctx, `▸ ${data.traits[i]}`, contentW, 20 * scale);
      for (const tl of traitLines) {
        ctx.fillText(tl, isWide ? contentX + contentW / 2 : w / 2, cursorY);
        cursorY += 20 * scale;
      }
      cursorY += 4 * scale;
    }
    cursorY += 16 * scale;
  }

  // Today's Reading (story format has space)
  if (isTall) {
    ctx.font = `500 ${11 * scale}px 'Inter', system-ui, sans-serif`;
    ctx.fillStyle = "rgba(212,175,55,0.6)";
    ctx.letterSpacing = `${2.5 * scale}px`;
    ctx.fillText("TODAY'S READING", w / 2, cursorY);
    ctx.letterSpacing = "0px";
    cursorY += 24 * scale;

    ctx.font = `italic 300 ${15 * scale}px 'Inter', system-ui, sans-serif`;
    ctx.fillStyle = "rgba(196,185,228,0.65)";
    const readingLines = wrapText(ctx, `"${data.horoscope}"`, contentW, 24 * scale);
    for (const rl of readingLines.slice(0, 6)) {
      ctx.fillText(rl, w / 2, cursorY);
      cursorY += 24 * scale;
    }
  }

  // ── Watermark ──
  const wmY = h - 40 * scale;
  ctx.textAlign = "center";
  ctx.font = `500 ${11 * scale}px 'Inter', system-ui, sans-serif`;
  ctx.fillStyle = "rgba(212,175,55,0.35)";
  ctx.letterSpacing = `${3 * scale}px`;
  ctx.fillText("✦  OLIVIA ARCANA", w / 2, wmY);
  ctx.letterSpacing = "0px";

  ctx.font = `300 ${9 * scale}px 'Inter', system-ui, sans-serif`;
  ctx.fillStyle = "rgba(180,170,210,0.2)";
  ctx.fillText("oliviaarcana.com", w / 2, wmY + 18 * scale);

  // ── Border ──
  ctx.strokeStyle = "rgba(212,175,55,0.1)";
  ctx.lineWidth = 1;
  ctx.strokeRect(20 * scale, 20 * scale, w - 40 * scale, h - 40 * scale);

  // ── Export ──
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png", 1.0);
  });
}

export async function shareChartCard(data: CardData, format: CardFormat): Promise<void> {
  const blob = await renderChartCard(data, format);
  const file = new File([blob], `olivia-arcana-${data.signName.toLowerCase()}.png`, { type: "image/png" });

  // Try native share
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: `${data.signName} — Olivia Arcana`,
        text: data.bigThree,
        files: [file],
      });
      return;
    } catch {
      // User cancelled or share failed — fall through to download
    }
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}
