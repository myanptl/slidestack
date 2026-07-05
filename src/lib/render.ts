import type { Carousel, Slide, ThemeSpec } from "./types";

export const SLIDE_W = 1080;
export const SLIDE_H = 1350;

const PAD = 96;
const DISPLAY = "'Archivo Black'";
const BODY = "'Space Grotesk'";

let fontsReady: Promise<void> | null = null;

export function ensureFonts(): Promise<void> {
  if (!fontsReady) {
    fontsReady = Promise.all([
      document.fonts.load(`400 100px ${DISPLAY}`),
      document.fonts.load(`500 40px ${BODY}`),
      document.fonts.load(`700 40px ${BODY}`),
    ]).then(() => undefined);
  }
  return fontsReady;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w;
    if (ctx.measureText(probe).width > maxWidth && line) {
      out.push(line);
      line = w;
    } else {
      line = probe;
    }
  }
  if (line) out.push(line);
  return out;
}

/** Pick the largest font size (descending) whose wrapped text fits maxLines. */
function fitTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  sizes: number[],
  maxLines: number,
): { size: number; lines: string[] } {
  for (const size of sizes) {
    ctx.font = `400 ${size}px ${DISPLAY}`;
    const lines = wrap(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
  }
  const size = sizes[sizes.length - 1];
  ctx.font = `400 ${size}px ${DISPLAY}`;
  return { size, lines: wrap(ctx, text, maxWidth).slice(0, maxLines) };
}

function paintChrome(
  ctx: CanvasRenderingContext2D,
  theme: ThemeSpec,
  index: number,
  total: number,
  handle: string,
) {
  // page number chip
  ctx.font = `700 34px ${BODY}`;
  const label = `${index + 1} / ${total}`;
  ctx.fillStyle = theme.ink;
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  ctx.fillText(label, SLIDE_W - PAD, PAD + 4);

  // handle bottom-left
  if (handle) {
    ctx.textAlign = "left";
    ctx.font = `500 34px ${BODY}`;
    ctx.globalAlpha = 0.65;
    ctx.fillText(handle.startsWith("@") ? handle : `@${handle}`, PAD, SLIDE_H - PAD + 10);
    ctx.globalAlpha = 1;
  }

  // swipe arrow on every slide except the last
  if (index < total - 1) {
    ctx.textAlign = "right";
    ctx.font = `400 44px ${DISPLAY}`;
    ctx.fillStyle = theme.accent;
    ctx.fillText("→", SLIDE_W - PAD, SLIDE_H - PAD + 6);
  }
}

function paintKicker(ctx: CanvasRenderingContext2D, theme: ThemeSpec, kicker: string, y: number): number {
  ctx.font = `700 38px ${BODY}`;
  const w = ctx.measureText(kicker.toUpperCase()).width;
  const chipH = 72;
  ctx.fillStyle = theme.accent;
  // offset "sticker" shadow
  ctx.fillRect(PAD + 8, y + 8, w + 56, chipH);
  ctx.fillStyle = theme.ink;
  ctx.fillRect(PAD, y, w + 56, chipH);
  ctx.fillStyle = theme.bg;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(kicker.toUpperCase(), PAD + 28, y + chipH / 2 + 3);
  return y + chipH + 56;
}

function paintSlide(
  ctx: CanvasRenderingContext2D,
  slide: Slide,
  theme: ThemeSpec,
  index: number,
  total: number,
  handle: string,
) {
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

  // subtle grid texture
  ctx.strokeStyle = theme.soft;
  ctx.lineWidth = 2;
  for (let x = 0; x <= SLIDE_W; x += 108) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, SLIDE_H);
    ctx.stroke();
  }

  const maxWidth = SLIDE_W - PAD * 2;
  const isHook = slide.type === "hook";
  const isCta = slide.type === "cta";

  let y = isHook || isCta ? 380 : 300;
  if (slide.kicker && !isHook) y = paintKicker(ctx, theme, slide.kicker, y - 60) + 10;

  // title
  const sizes = isHook ? [128, 112, 96, 84, 72] : [96, 84, 72, 62, 54];
  const fitted = fitTitle(ctx, slide.title, maxWidth, sizes, isHook ? 5 : 4);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const lineH = fitted.size * 1.14;
  ctx.font = `400 ${fitted.size}px ${DISPLAY}`;
  for (let i = 0; i < fitted.lines.length; i++) {
    // accent the last title line on hook/cta slides
    const last = i === fitted.lines.length - 1 && (isHook || isCta) && fitted.lines.length > 1;
    ctx.fillStyle = last ? theme.accent : theme.ink;
    ctx.fillText(fitted.lines[i], PAD, y + fitted.size);
    y += lineH;
  }
  y += 56;

  // accent underline bar
  ctx.fillStyle = theme.accent;
  ctx.fillRect(PAD, y, 180, 14);
  y += 96;

  // body lines
  ctx.font = `500 44px ${BODY}`;
  ctx.fillStyle = theme.ink;
  for (const raw of slide.lines.slice(0, 3)) {
    const wrapped = wrap(ctx, raw, maxWidth - 70);
    // accent tick
    ctx.fillStyle = theme.accent;
    ctx.fillRect(PAD, y + 14, 26, 26);
    ctx.fillStyle = theme.ink;
    for (const l of wrapped) {
      ctx.fillText(l, PAD + 70, y + 44);
      y += 62;
    }
    y += 34;
  }

  paintChrome(ctx, theme, index, total, handle);
}

export async function renderCarousel(
  carousel: Carousel,
  theme: ThemeSpec,
  handle: string,
): Promise<string[]> {
  await ensureFonts();
  const urls: string[] = [];
  const canvas = document.createElement("canvas");
  canvas.width = SLIDE_W;
  canvas.height = SLIDE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported in this browser.");
  const total = carousel.slides.length;
  for (let i = 0; i < total; i++) {
    paintSlide(ctx, carousel.slides[i], theme, i, total, handle);
    urls.push(canvas.toDataURL("image/png"));
  }
  return urls;
}
