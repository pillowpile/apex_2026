import { PixelModule } from "../../engine/types";
import { palettes } from "../../palettes/palettes";
import { sampleGradient } from "../../utilities/color";

const TAU = Math.PI * 2;
const SCALE = 8;
const GUST = 0.7;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  seed: number;
  color: number;
};

let particles: Particle[] = [];

function spawn(ctx: Parameters<NonNullable<PixelModule["init"]>>[0]): Particle {
  let x = 0;
  let y = 0;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    x = ctx.random.range(0, ctx.width);
    y = ctx.random.range(0, ctx.height);
    if (ctx.isPyramid(Math.floor(x), Math.floor(y))) break;
  }
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    seed: ctx.random.range(0, 1000),
    color: ctx.random.next(),
  };
}

function wrap(value: number, size: number) {
  return ((value % size) + size) % size;
}

export const windModule: PixelModule = {
  id: "wind",
  name: "Wind Field",
  description: "Dense pixel dust carried across the matrix by a turbulent wind flow field.",
  parameters: {
    count: { type: "number", label: "Count", min: 40, max: 2992, step: 1, default: 240 },
    windAngle: { type: "number", label: "Wind Angle", min: 0, max: 360, step: 1, default: 20 },
    autoAngle: { type: "boolean", label: "Auto Rotate", default: false },
    windStrength: { type: "number", label: "Wind Strength", min: 0.2, max: 6, step: 0.1, default: 2.2 },
    turbulence: { type: "number", label: "Turbulence", min: 0, max: 2, step: 0.05, default: 0.7 },
    swirlScale: { type: "number", label: "Swirl Scale", min: 0.02, max: 0.2, step: 0.01, default: 0.07 },
    trail: { type: "number", label: "Trail", min: 0, max: 0.9, step: 0.05, default: 0.35 },
    colorMode: {
      type: "select",
      label: "Color Mode",
      options: ["spread", "direction"],
      default: "spread",
    },
    palette: { type: "palette", label: "Palette", default: "vivid" },
  },
  init(ctx, params) {
    particles = Array.from({ length: Number(params.count) }, () => spawn(ctx));
  },
  update(deltaTime, ctx, params) {
    while (particles.length < Number(params.count)) particles.push(spawn(ctx));
    particles.length = Number(params.count);

    const autoOffset = Boolean(params.autoAngle) ? (ctx.time / 120) * TAU : 0;
    const baseAngle = (Number(params.windAngle) * Math.PI) / 180 + autoOffset;
    const windStrength = Number(params.windStrength);
    const turbulence = Number(params.turbulence);
    const swirlScale = Number(params.swirlScale);

    for (const particle of particles) {
      const field = ctx.noise.fbm2D(
        particle.x * swirlScale,
        particle.y * swirlScale + ctx.time * 0.12,
        3,
      );
      const angle = baseAngle + (field - 0.5) * turbulence * TAU;
      const gustFactor = 0.6 + ctx.noise.value2D(ctx.time * 0.3, particle.seed) * GUST;
      const speed = windStrength * gustFactor;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.x = wrap(particle.x + particle.vx * deltaTime * SCALE, ctx.width);
      particle.y = wrap(particle.y + particle.vy * deltaTime * SCALE, ctx.height);

      if (!ctx.isPyramid(Math.floor(particle.x), Math.floor(particle.y))) {
        for (let attempt = 0; attempt < 10; attempt += 1) {
          const x = ctx.random.range(0, ctx.width);
          const y = ctx.random.range(0, ctx.height);
          if (ctx.isPyramid(Math.floor(x), Math.floor(y))) {
            particle.x = x;
            particle.y = y;
            break;
          }
        }
      }
    }
  },
  render(framebuffer, ctx, params) {
    const palette = palettes[String(params.palette) as keyof typeof palettes] ?? palettes.vivid;
    const colorMode = String(params.colorMode);

    framebuffer.fade(Number(params.trail));

    for (const particle of particles) {
      const t = colorMode === "direction"
        ? Math.atan2(particle.vy, particle.vx) / TAU + 0.5
        : particle.color;
      framebuffer.addPixel(particle.x, particle.y, sampleGradient(palette.colors, t), 0.85);
    }
  },
};
