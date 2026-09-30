/**
 * "My sky, dealt in cards": the reader's Sun, Moon and Rising cards composed
 * on lapis as a 1080 × 1350 image, made on the device. It carries the signs
 * and cards only, never the birth date, time or place.
 */

export type ShareCard = { role: string; sign: string; card: string; image: string };
export type ShareText = { title: string; site: string };

const W = 1080, H = 1350;

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** The page's own font stacks, so the image is set in the brand's type. */
function fontStack(variable: string, fallback: string): string {
  const value = getComputedStyle(document.body).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderShareImage(cards: ShareCard[], text: ShareText): Promise<Blob> {
  const heading = fontStack("--font-heading", '"Cormorant Garamond", serif');
  const body = fontStack("--font-body", '"DM Sans", sans-serif');
  const mono = fontStack("--font-mono", "ui-monospace, monospace");
  await Promise.all([document.fonts.load(`400 64px ${heading}`), document.fonts.load(`italic 400 34px ${heading}`), document.fonts.load(`500 24px ${body}`)]).catch(() => undefined);
  const [lapis, ...art] = await Promise.all([load("/astrology/lapis.webp"), ...cards.map((c) => load(c.image))]);

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Lapis ground, darkened at the edges
  ctx.fillStyle = "#0b192a"; ctx.fillRect(0, 0, W, H);
  const side = Math.max(W, H);
  ctx.globalAlpha = 0.9; ctx.drawImage(lapis, (W - side) / 2, (H - side) / 2, side, side); ctx.globalAlpha = 1;
  const vignette = ctx.createRadialGradient(W / 2, H * 0.45, W * 0.2, W / 2, H * 0.45, W * 0.85);
  vignette.addColorStop(0, "rgba(11,25,42,0)"); vignette.addColorStop(1, "rgba(5,12,22,0.78)");
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);

  // Inset hairline frame
  ctx.strokeStyle = "rgba(216,196,156,0.42)"; ctx.lineWidth = 2; roundRect(ctx, 36, 36, W - 72, H - 72, 22); ctx.stroke();

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ede4d2"; ctx.font = `400 76px ${heading}`; ctx.fillText("Olivia", W / 2, 150);
  ctx.fillStyle = "#c9b182"; ctx.font = `500 20px ${mono}`;
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "8px";
  ctx.fillText("ARCANA", W / 2 + 4, 186);
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
  ctx.fillStyle = "#ede4d2"; ctx.font = `italic 400 40px ${heading}`; ctx.fillText(text.title, W / 2, 262);

  // The cards, each with its role above and its sign and card below
  const cw = cards.length === 3 ? 304 : 340, ch = Math.round(cw * (1536 / 896)), gap = 30;
  const total = cards.length * cw + (cards.length - 1) * gap;
  const top = 372;
  cards.forEach((card, i) => {
    const x = (W - total) / 2 + i * (cw + gap);
    ctx.save();
    ctx.shadowColor = "rgba(230,207,158,0.35)"; ctx.shadowBlur = 44;
    roundRect(ctx, x, top, cw, ch, 14); ctx.fillStyle = "#0b192a"; ctx.fill();
    ctx.restore();
    ctx.save(); roundRect(ctx, x, top, cw, ch, 14); ctx.clip(); ctx.drawImage(art[i], x, top, cw, ch); ctx.restore();
    ctx.strokeStyle = "#e6cf9e"; ctx.lineWidth = 2.5; roundRect(ctx, x, top, cw, ch, 14); ctx.stroke();

    const cx = x + cw / 2;
    ctx.fillStyle = "#f0dcae"; ctx.font = `500 21px ${mono}`;
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "6px";
    ctx.fillText(card.role.toUpperCase(), cx + 3, top - 26);
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
    ctx.fillStyle = "rgba(230,207,158,0.55)"; ctx.fillRect(cx - 40, top - 14, 80, 1.5);
    ctx.fillStyle = "#ede4d2"; ctx.font = `400 44px ${heading}`; ctx.fillText(card.sign, cx, top + ch + 62);
    ctx.fillStyle = "#c9b182"; ctx.font = `500 23px ${body}`; ctx.fillText(card.card, cx, top + ch + 100);
  });

  // An engraved eight-pointed star between the cards and the address
  const sy = top + ch + 190, s = 26;
  ctx.beginPath();
  for (let k = 0; k < 16; k++) { const r = k % 2 ? s * 0.2 : (k / 2) % 2 ? s * 0.55 : s; const a = (k * Math.PI) / 8 - Math.PI / 2; const px = W / 2 + r * Math.cos(a), py = sy + r * Math.sin(a); if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.closePath();
  const gold = ctx.createLinearGradient(W / 2 - s, sy - s, W / 2 + s, sy + s); gold.addColorStop(0, "#fdebb8"); gold.addColorStop(0.5, "#dfb866"); gold.addColorStop(1, "#a47a37");
  ctx.save(); ctx.shadowColor = "rgba(240,204,120,0.7)"; ctx.shadowBlur = 18; ctx.fillStyle = gold; ctx.fill(); ctx.restore();
  ctx.fillStyle = "rgba(216,196,156,0.4)"; ctx.fillRect(W / 2 - 60, H - 118, 120, 1.5);
  ctx.fillStyle = "rgba(238,230,212,0.7)"; ctx.font = `500 22px ${mono}`; ctx.fillText(text.site, W / 2, H - 78);

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))), "image/jpeg", 0.92));
}

/** Share the image where the device can, otherwise save it. */
export async function shareOrSave(blob: Blob, filename: string, title: string): Promise<"shared" | "saved"> {
  const file = new File([blob], filename, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title }); return "shared"; }
    catch (error) { if ((error as DOMException)?.name === "AbortError") return "shared"; }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "saved";
}
