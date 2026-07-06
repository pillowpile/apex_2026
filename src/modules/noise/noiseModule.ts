import { PixelModule } from "../../engine/types";
import { paletteNames, palettes } from "../../palettes/palettes";
import { sampleGradient } from "../../utilities/color";

export const noiseModule: PixelModule = {
  id: "noise",
  name: "Noise Field",
  description: "Layered procedural noise drifting across the physical matrix.",
  parameters: {
    speed: { type: "number", label: "Speed", min: 0, max: 2, step: 0.01, default: 0.28 },
    scale: { type: "number", label: "Scale", min: 0.03, max: 0.45, step: 0.01, default: 0.16 },
    contrast: { type: "number", label: "Contrast", min: 0.4, max: 3, step: 0.05, default: 1.35 },
    palette: { type: "palette", label: "Palette", default: "colorful" },
  },
  render(framebuffer, ctx, params) {
    const palette = palettes[String(params.palette) as keyof typeof palettes] ?? palettes.colorful;
    const speed = Number(params.speed);
    const scale = Number(params.scale);
    const contrast = Number(params.contrast);

    for (let y = 0; y < ctx.height; y += 1) {
      for (let x = 0; x < ctx.width; x += 1) {
        if (!ctx.isPyramid(x, y)) continue;
        const n = ctx.noise.fbm2D(x * scale + ctx.time * speed, y * scale - ctx.time * speed * 0.4, 5);
        const shaped = Math.max(0, Math.min(1, (n - 0.5) * contrast + 0.5));
        framebuffer.setPixel(x, y, sampleGradient(palette.colors, shaped));
      }
    }
  },
};
