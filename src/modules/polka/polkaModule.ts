import { RGB } from "../../engine/Framebuffer";
import { PixelModule } from "../../engine/types";
import { palettes } from "../../palettes/palettes";
import { hexToRgb, sampleGradient } from "../../utilities/color";

const BASE = 12;
const G = 20;

type Dot = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  colorBase: number;
  hollow: boolean;
};

let dots: Dot[] = [];

function isHollow(style: string, ctx: Parameters<NonNullable<PixelModule["init"]>>[0]) {
  if (style === "rings") return true;
  if (style === "filled") return false;
  return ctx.random.chance(0.5);
}

function spawn(ctx: Parameters<NonNullable<PixelModule["init"]>>[0], speed: number, style: string): Dot {
  const angle = ctx.random.range(0, Math.PI * 2);
  const magnitude = speed * BASE;
  return {
    x: ctx.random.range(6, ctx.width - 6),
    y: ctx.random.range(6, ctx.height - 6),
    vx: Math.cos(angle) * magnitude,
    vy: Math.sin(angle) * magnitude,
    phase: ctx.random.range(0, Math.PI * 2),
    colorBase: ctx.random.next(),
    hollow: isHollow(style, ctx),
  };
}

function wrap01(value: number) {
  return value - Math.floor(value);
}

function topBoundary(x: number, size: number, ctx: Parameters<NonNullable<PixelModule["init"]>>[0]) {
  let y = size;
  while (y < ctx.height && !ctx.isPyramid(Math.round(x), Math.round(y - size))) {
    y += 1;
  }
  return y;
}

function drawDot(
  framebuffer: Parameters<PixelModule["render"]>[0],
  cx: number,
  cy: number,
  radius: number,
  color: RGB,
  hollow: boolean,
) {
  const outer2 = radius * radius;
  const inner = hollow ? radius - 1.6 : 0;
  const inner2 = inner > 0 ? inner * inner : -1;
  const minX = Math.floor(cx - radius);
  const maxX = Math.ceil(cx + radius);
  const minY = Math.floor(cy - radius);
  const maxY = Math.ceil(cy + radius);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (d2 <= outer2 && d2 >= inner2) framebuffer.setPixel(x, y, color);
    }
  }
}

export const polkaModule: PixelModule = {
  id: "polka",
  name: "Polka Party",
  description: "Bold bouncing dots that pulse, cycle color, and jostle with playful physics.",
  parameters: {
    count: { type: "number", label: "Count", min: 3, max: 40, step: 1, default: 16 },
    size: { type: "number", label: "Size", min: 1, max: 10, step: 0.5, default: 4 },
    pulse: { type: "number", label: "Pulse", min: 0, max: 1, step: 0.05, default: 0.4 },
    speed: { type: "number", label: "Speed", min: 0, max: 3, step: 0.05, default: 1 },
    colorShift: { type: "number", label: "Color Shift", min: 0, max: 2, step: 0.05, default: 0.3 },
    gravity: { type: "number", label: "Gravity", min: 0, max: 3, step: 0.05, default: 0 },
    collision: { type: "boolean", label: "Collision", default: true },
    style: { type: "select", label: "Style", options: ["mixed", "filled", "rings"], default: "mixed" },
    background: { type: "color", label: "Background", default: "#ffffff" },
    palette: { type: "palette", label: "Palette", default: "colorful" },
  },
  init(ctx, params) {
    const speed = Number(params.speed);
    const style = String(params.style);
    dots = Array.from({ length: Number(params.count) }, () => spawn(ctx, speed, style));
  },
  update(deltaTime, ctx, params) {
    const speed = Number(params.speed);
    const style = String(params.style);
    const size = Number(params.size);
    const gravity = Number(params.gravity);
    const collision = Boolean(params.collision);

    while (dots.length < Number(params.count)) dots.push(spawn(ctx, speed, style));
    dots.length = Number(params.count);

    for (const dot of dots) {
      dot.vy += gravity * G * deltaTime;
      dot.x += dot.vx * deltaTime;
      dot.y += dot.vy * deltaTime;
      if (dot.x < size) {
        dot.x = size;
        dot.vx = Math.abs(dot.vx);
      } else if (dot.x > ctx.width - size) {
        dot.x = ctx.width - size;
        dot.vx = -Math.abs(dot.vx);
      }
      const minY = topBoundary(dot.x, size, ctx);
      if (dot.y < minY) {
        dot.y = minY;
        dot.vy = Math.abs(dot.vy);
      } else if (dot.y > ctx.height - size) {
        dot.y = ctx.height - size;
        dot.vy = -Math.abs(dot.vy);
      }
    }

    if (collision) {
      const minDist = size * 2;
      for (let i = 0; i < dots.length; i += 1) {
        for (let j = i + 1; j < dots.length; j += 1) {
          const a = dots[i];
          const b = dots[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          if (dist >= minDist || dist === 0) continue;
          const nx = dx / dist;
          const ny = dy / dist;
          const velN = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (velN < 0) {
            const impulse = velN;
            a.vx += impulse * nx;
            a.vy += impulse * ny;
            b.vx -= impulse * nx;
            b.vy -= impulse * ny;
          }
          const push = (minDist - dist) / 2;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }
  },
  render(framebuffer, ctx, params) {
    const palette = palettes[String(params.palette) as keyof typeof palettes] ?? palettes.colorful;
    const size = Number(params.size);
    const pulse = Number(params.pulse);
    const colorShift = Number(params.colorShift);

    framebuffer.clear(hexToRgb(String(params.background)));

    for (const dot of dots) {
      const radius = size * (1 + pulse * Math.sin(ctx.time * 2 + dot.phase));
      const color = sampleGradient(palette.colors, wrap01(dot.colorBase + ctx.time * colorShift));
      drawDot(framebuffer, dot.x, dot.y, Math.max(0.5, radius), color, dot.hollow);
    }
  },
};
