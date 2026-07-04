import { RGB } from "../../engine/Framebuffer";
import { PixelModule } from "../../engine/types";
import { hexToRgb } from "../../utilities/color";

type Creature = {
  x: number;
  y: number;
  vx: number;
  phase: number;
  blinkUntil: number;
};

let creatures: Creature[] = [];

const body: RGB = [68, 214, 184];
const shadow: RGB = [14, 55, 62];

function drawCreature(framebuffer: Parameters<PixelModule["render"]>[0], creature: Creature, time: number, color: RGB) {
  const x = Math.round(creature.x);
  const y = Math.round(creature.y + Math.sin(time * 2 + creature.phase) * 0.4);
  const eyesOpen = time > creature.blinkUntil;
  framebuffer.fillRect(x - 2, y - 1, 5, 3, shadow);
  framebuffer.fillRect(x - 1, y - 2, 3, 5, color);
  framebuffer.setPixel(x - 1, y - 1, eyesOpen ? [240, 255, 230] : [20, 52, 48]);
  framebuffer.setPixel(x + 1, y - 1, eyesOpen ? [240, 255, 230] : [20, 52, 48]);
  framebuffer.setPixel(x, y + 2, [20, 103, 86]);
}

export const creatureModule: PixelModule = {
  id: "creatures",
  name: "Pixel Creatures",
  description: "Small autonomous beings that drift, blink, breathe, and gather.",
  parameters: {
    count: { type: "number", label: "Count", min: 1, max: 12, step: 1, default: 5 },
    speed: { type: "number", label: "Speed", min: 0.05, max: 2, step: 0.01, default: 0.42 },
    bodyColor: { type: "color", label: "Body", default: "#44d6b8" },
    trails: { type: "boolean", label: "Trails", default: true },
  },
  init(ctx, params) {
    creatures = [];
    for (let i = 0; i < Number(params.count); i += 1) {
      creatures.push({
        x: ctx.random.range(4, ctx.width - 4),
        y: ctx.random.range(5, ctx.height - 5),
        vx: ctx.random.range(-1, 1),
        phase: ctx.random.range(0, Math.PI * 2),
        blinkUntil: 0,
      });
    }
  },
  update(deltaTime, ctx, params) {
    const desired = Number(params.count);
    while (creatures.length < desired) {
      creatures.push({
        x: ctx.random.range(4, ctx.width - 4),
        y: ctx.random.range(5, ctx.height - 5),
        vx: ctx.random.range(-1, 1),
        phase: ctx.random.range(0, Math.PI * 2),
        blinkUntil: 0,
      });
    }
    creatures.length = desired;

    for (const creature of creatures) {
      const drift = ctx.noise.value2D(creature.x * 0.07, ctx.time * 0.25 + creature.phase) - 0.5;
      creature.vx += drift * deltaTime * 2;
      creature.vx *= 0.95;
      creature.x += creature.vx * Number(params.speed) * deltaTime * 8;
      creature.y += Math.sin(ctx.time * 0.6 + creature.phase) * deltaTime * 0.5;
      if (creature.x < 3 || creature.x > ctx.width - 4) creature.vx *= -1;
      creature.x = Math.max(3, Math.min(ctx.width - 4, creature.x));
      creature.y = Math.max(4, Math.min(ctx.height - 4, creature.y));
      if (ctx.random.chance(0.006)) creature.blinkUntil = ctx.time + ctx.random.range(0.09, 0.22);
    }
  },
  render(framebuffer, ctx, params) {
    if (Boolean(params.trails)) framebuffer.fade(0.82);
    else framebuffer.clear([2, 4, 6]);
    const color = hexToRgb(String(params.bodyColor));
    for (const creature of creatures) {
      drawCreature(framebuffer, creature, ctx.time, color ?? body);
    }
  },
};
