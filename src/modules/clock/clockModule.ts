import { PixelModule } from "../../engine/types";
import { hexToRgb } from "../../utilities/color";

const digitMap: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  ":": ["0", "1", "0", "1", "0"],
};

function drawText(
  framebuffer: Parameters<PixelModule["render"]>[0],
  ctx: Parameters<PixelModule["render"]>[1],
  text: string,
  x: number,
  y: number,
  color: [number, number, number],
) {
  let cursor = x;
  for (const char of text) {
    const glyph = digitMap[char];
    if (!glyph) {
      cursor += 2;
      continue;
    }
    for (let gy = 0; gy < glyph.length; gy += 1) {
      for (let gx = 0; gx < glyph[gy].length; gx += 1) {
        if (glyph[gy][gx] === "1" && ctx.isPyramid(cursor + gx, y + gy)) framebuffer.setPixel(cursor + gx, y + gy, color);
      }
    }
    cursor += glyph[0].length + 1;
  }
}

export const clockModule: PixelModule = {
  id: "clock",
  name: "Clock",
  description: "A minimal pixel clock with a slow atmospheric background.",
  parameters: {
    color: { type: "color", label: "Digits", default: "#eee858" },
    drift: { type: "number", label: "Background", min: 0, max: 1, step: 0.01, default: 0.38 },
    seconds: { type: "boolean", label: "Seconds", default: false },
  },
  render(framebuffer, ctx, params) {
    const drift = Number(params.drift);
    for (let y = 0; y < ctx.height; y += 1) {
      for (let x = 0; x < ctx.width; x += 1) {
        if (!ctx.isPyramid(x, y)) continue;
        const glow = ctx.noise.fbm2D(x * 0.05 + ctx.time * 0.04, y * 0.08, 3) * drift;
        framebuffer.setPixel(x, y, [Math.round(8 * glow), Math.round(18 * glow), Math.round(24 * glow)]);
      }
    }

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const text = Boolean(params.seconds) ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
    const width = text.length * 4 - 1;
    drawText(framebuffer, ctx, text, Math.floor((ctx.width - width) / 2), 15, hexToRgb(String(params.color)));
  },
};
