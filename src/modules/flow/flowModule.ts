import { PixelModule } from "../../engine/types";
import { palettes } from "../../palettes/palettes";
import { sampleGradient } from "../../utilities/color";

type Particle = {
  x: number;
  y: number;
  life: number;
};

let particles: Particle[] = [];

function resetParticle(particle: Particle, ctx: Parameters<NonNullable<PixelModule["init"]>>[0]) {
  let x = 0;
  let y = 0;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    x = ctx.random.range(0, ctx.width);
    y = ctx.random.range(0, ctx.height);
    if (ctx.isPyramid(Math.floor(x), Math.floor(y))) break;
  }
  particle.x = x;
  particle.y = y;
  particle.life = ctx.random.range(0.2, 1);
}

export const flowModule: PixelModule = {
  id: "flow",
  name: "Flow Particles",
  description: "Particles following a noise-derived vector field with luminous trails.",
  parameters: {
    count: { type: "number", label: "Count", min: 20, max: 220, step: 1, default: 96 },
    speed: { type: "number", label: "Speed", min: 0.1, max: 5, step: 0.05, default: 1.35 },
    fade: { type: "number", label: "Fade", min: 0.75, max: 0.98, step: 0.01, default: 0.9 },
    palette: { type: "palette", label: "Palette", default: "ember" },
  },
  init(ctx, params) {
    particles = Array.from({ length: Number(params.count) }, () => ({ x: 0, y: 0, life: 0 }));
    particles.forEach((particle) => resetParticle(particle, ctx));
  },
  update(deltaTime, ctx, params) {
    while (particles.length < Number(params.count)) particles.push({ x: 0, y: 0, life: 0 });
    particles.length = Number(params.count);

    for (const particle of particles) {
      const field = ctx.noise.fbm2D(particle.x * 0.06, particle.y * 0.06 + ctx.time * 0.16, 3);
      const angle = field * Math.PI * 4 + ctx.time * 0.18;
      particle.x += Math.cos(angle) * Number(params.speed) * deltaTime * 8;
      particle.y += Math.sin(angle) * Number(params.speed) * deltaTime * 8;
      particle.life -= deltaTime * 0.16;
      if (
        particle.life <= 0 ||
        particle.x < 0 ||
        particle.x >= ctx.width ||
        particle.y < 0 ||
        particle.y >= ctx.height ||
        !ctx.isPyramid(Math.floor(particle.x), Math.floor(particle.y))
      ) {
        resetParticle(particle, ctx);
      }
    }
  },
  render(framebuffer, ctx, params) {
    const palette = palettes[String(params.palette) as keyof typeof palettes] ?? palettes.ember;
    framebuffer.fade(Number(params.fade));
    for (const particle of particles) {
      const color = sampleGradient(palette.colors, particle.life);
      framebuffer.addPixel(particle.x, particle.y, color, 0.75);
    }
  },
};
