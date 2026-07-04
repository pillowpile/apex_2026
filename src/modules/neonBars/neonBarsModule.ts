import { RGB } from "../../engine/Framebuffer";
import { PixelModule } from "../../engine/types";

const stripeColors: RGB[] = [
  [0, 216, 255],
  [255, 42, 145],
  [255, 232, 30],
  [24, 224, 80],
  [255, 90, 40],
  [92, 68, 255],
  [255, 255, 248],
  [0, 178, 152],
  [255, 58, 70],
  [174, 255, 42],
  [26, 108, 255],
  [255, 151, 28],
];

const dropoutColors: RGB[] = [
  [2, 4, 8],
  [18, 15, 28],
  [244, 248, 238],
];

function wrap(value: number, size: number) {
  return ((value % size) + size) % size;
}

function hash(value: number) {
  const wave = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return wave - Math.floor(wave);
}

function scaleColor(color: RGB, amount: number): RGB {
  return [
    Math.max(0, Math.min(255, Math.round(color[0] * amount))),
    Math.max(0, Math.min(255, Math.round(color[1] * amount))),
    Math.max(0, Math.min(255, Math.round(color[2] * amount))),
  ];
}

function setWrappedSegment(
  framebuffer: Parameters<PixelModule["render"]>[0],
  y: number,
  start: number,
  length: number,
  color: RGB,
) {
  for (let step = 0; step < length; step += 1) {
    framebuffer.setPixel(wrap(start + step, framebuffer.width), y, color);
  }
}

export const neonBarsModule: PixelModule = {
  id: "neon-bars",
  name: "Neon Bars",
  description: "Screenshot-inspired horizontal color bars with animated dropouts.",
  parameters: {
    motion: {
      type: "select",
      label: "Motion",
      options: ["slide", "roll", "ripple", "glitch", "static"],
      default: "slide",
    },
    speed: { type: "number", label: "Speed", min: 0, max: 4, step: 0.01, default: 0.9 },
    bandHeight: { type: "number", label: "Band Height", min: 1, max: 3, step: 1, default: 1 },
    segments: { type: "number", label: "Dropouts", min: 0, max: 8, step: 1, default: 4 },
    gapScale: { type: "number", label: "Gap Size", min: 0.25, max: 2.5, step: 0.05, default: 1.2 },
    jitter: { type: "number", label: "Jitter", min: 0, max: 9, step: 0.1, default: 2.4 },
    colorCycle: { type: "number", label: "Color Cycle", min: 0, max: 3, step: 0.01, default: 0.42 },
    brightness: { type: "number", label: "Brightness", min: 0.25, max: 1.4, step: 0.01, default: 1 },
  },
  render(framebuffer, ctx, params) {
    const motion = String(params.motion);
    const speed = Number(params.speed);
    const bandHeight = Math.max(1, Math.round(Number(params.bandHeight)));
    const segments = Math.max(0, Math.round(Number(params.segments)));
    const gapScale = Number(params.gapScale);
    const jitter = Number(params.jitter);
    const colorCycle = Number(params.colorCycle);
    const brightness = Number(params.brightness);
    const glitchTick = Math.floor(ctx.time * (8 + speed * 8));
    const colorPhase = Math.floor(ctx.time * colorCycle * 8);
    const rollingRows = motion === "roll" ? ctx.time * speed * 10 : 0;

    framebuffer.clear([3, 3, 6]);

    for (let y = 0; y < ctx.height; y += 1) {
      const rippleRows = motion === "ripple" ? Math.sin(ctx.time * speed * 2.2 + y * 0.48) * 1.5 : 0;
      const sourceY = Math.floor(y + rollingRows + rippleRows);
      const band = Math.floor(sourceY / bandHeight);
      const baseColor = stripeColors[wrap(band * 5 + colorPhase, stripeColors.length)];
      const rowPulse = 0.78 + hash(band * 19.13) * 0.32;
      const rowColor = scaleColor(baseColor, brightness * rowPulse);
      const direction = hash(band * 5.7) > 0.5 ? 1 : -1;
      const slide = motion === "slide" ? ctx.time * speed * 16 * direction : 0;
      const ripple = motion === "ripple" ? Math.sin(ctx.time * speed * 3.4 + band * 0.7) * jitter : 0;
      const glitch = motion === "glitch" ? Math.floor((hash(band * 41 + glitchTick) - 0.5) * jitter * 2) : 0;
      const rowOffset = Math.round(slide + ripple + glitch);

      for (let x = 0; x < ctx.width; x += 1) {
        framebuffer.setPixel(wrap(x + rowOffset, ctx.width), y, rowColor);
      }

      for (let segment = 0; segment < segments; segment += 1) {
        const seed = band * 73.3 + segment * 29.9;
        const driftDirection = hash(seed + 9) > 0.5 ? 1 : -1;
        const drift = motion === "static" ? 0 : ctx.time * speed * (4 + segment * 1.6) * driftDirection;
        const snap = motion === "glitch" ? Math.floor((hash(seed + glitchTick * 11) - 0.5) * jitter * 4) : 0;
        const start = Math.floor(hash(seed) * ctx.width + drift + rowOffset + snap);
        const length = Math.max(1, Math.round((2 + hash(seed + 5) * 13) * gapScale));
        const color = dropoutColors[Math.floor(hash(seed + 17) * dropoutColors.length)];

        setWrappedSegment(framebuffer, y, start, length, color);
      }
    }
  },
};
