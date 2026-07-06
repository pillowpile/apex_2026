import { PixelModule } from "../../engine/types";
import { palettes } from "../../palettes/palettes";
import { sampleGradient } from "../../utilities/color";

const TAU = Math.PI * 2;
const WANDER = 16;

function hash01(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function originHome(i: number, count: number, width: number, height: number): [number, number] {
  if (count === 1) return [(width - 1) / 2, (height - 1) / 2];
  const margin = 5;
  return [
    margin + hash01(i * 2.17 + 1) * (width - 1 - 2 * margin),
    margin + hash01(i * 3.71 + 5) * (height - 1 - 2 * margin),
  ];
}

export const wavesModule: PixelModule = {
  id: "waves",
  name: "Concentric Waves",
  description: "Expanding ripples radiating from one or many drifting raindrop sources.",
  parameters: {
    speed: { type: "number", label: "Speed", min: 0, max: 4, step: 0.05, default: 0.9 },
    wavelength: { type: "number", label: "Wavelength", min: 2, max: 20, step: 0.5, default: 6 },
    sharpness: { type: "number", label: "Sharpness", min: 1, max: 8, step: 0.1, default: 2.4 },
    fade: { type: "number", label: "Edge Fade", min: 0.2, max: 4, step: 0.1, default: 1.5 },
    origins: { type: "number", label: "Origins", min: 1, max: 8, step: 1, default: 1 },
    drift: { type: "number", label: "Drift", min: 0, max: 1, step: 0.05, default: 0 },
    shape: { type: "select", label: "Shape", options: ["circle", "square"], default: "circle" },
    palette: { type: "palette", label: "Palette", default: "signal" },
  },
  render(framebuffer, ctx, params) {
    const palette = palettes[String(params.palette) as keyof typeof palettes] ?? palettes.signal;
    const speed = Number(params.speed);
    const wavelength = Number(params.wavelength);
    const sharpness = Number(params.sharpness);
    const fade = Number(params.fade);
    const square = String(params.shape) === "square";
    const originCount = Math.max(1, Math.round(Number(params.origins)));
    const drift = Number(params.drift);

    const cx = (ctx.width - 1) / 2;
    const cy = (ctx.height - 1) / 2;
    const reach = square ? Math.max(cx, cy) : Math.hypot(cx, cy);
    const phaseOffset = ctx.time * speed;
    const wanderT = ctx.time * 0.35;

    const origins = [];
    for (let i = 0; i < originCount; i += 1) {
      const [hx, hy] = originHome(i, originCount, ctx.width, ctx.height);
      origins.push({
        x: hx + (ctx.noise.value2D(i * 5.5 + 1.3, wanderT) - 0.5) * WANDER * drift,
        y: hy + (ctx.noise.value2D(i * 5.5 + 40.7, wanderT + 12) - 0.5) * WANDER * drift,
        phase: hash01(i * 1.7),
      });
    }

    for (let y = 0; y < ctx.height; y += 1) {
      for (let x = 0; x < ctx.width; x += 1) {
        let intensity = 0;
        for (const origin of origins) {
          const dx = Math.abs(x - origin.x);
          const dy = Math.abs(y - origin.y);
          const distance = square ? Math.max(dx, dy) : Math.hypot(dx, dy);
          const ring = (Math.sin((distance / wavelength - phaseOffset - origin.phase) * TAU) + 1) / 2;
          const shaped = Math.max(0, Math.min(1, (ring - 0.5) * sharpness + 0.5));
          const falloff = Math.pow(Math.max(0, 1 - distance / reach), fade);
          intensity = Math.max(intensity, shaped * falloff);
        }
        if (ctx.isPyramid(x, y)) framebuffer.setPixel(x, y, sampleGradient(palette.colors, intensity));
      }
    }
  },
};
