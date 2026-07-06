import { PixelModule } from "../../engine/types";
import { paletteNames, palettes } from "../../palettes/palettes";
import { sampleGradient } from "../../utilities/color";

let grid: Uint8Array;
let next: Uint8Array;
let accumulator = 0;

function index(x: number, y: number, width: number) {
  return y * width + x;
}

function randomize(ctx: Parameters<NonNullable<PixelModule["init"]>>[0], density: number) {
  grid = new Uint8Array(ctx.width * ctx.height);
  next = new Uint8Array(ctx.width * ctx.height);
  for (let y = 0; y < ctx.height; y += 1) {
    for (let x = 0; x < ctx.width; x += 1) {
      grid[index(x, y, ctx.width)] = ctx.isPyramid(x, y) && ctx.random.chance(density) ? 1 : 0;
    }
  }
}

export const conwayModule: PixelModule = {
  id: "conway",
  name: "Conway",
  description: "Classic cellular automata with fading cells and periodic reseeding.",
  parameters: {
    rate: { type: "number", label: "Rate", min: 1, max: 24, step: 1, default: 9 },
    density: { type: "number", label: "Density", min: 0.05, max: 0.65, step: 0.01, default: 0.28 },
    palette: { type: "palette", label: "Palette", default: "signal" },
  },
  init(ctx, params) {
    accumulator = 0;
    randomize(ctx, Number(params.density));
  },
  update(deltaTime, ctx, params) {
    accumulator += deltaTime;
    const interval = 1 / Number(params.rate);
    if (accumulator < interval) return;
    accumulator = 0;

    for (let y = 0; y < ctx.height; y += 1) {
      for (let x = 0; x < ctx.width; x += 1) {
        if (!ctx.isPyramid(x, y)) {
          next[index(x, y, ctx.width)] = 0;
          continue;
        }
        let neighbors = 0;
        for (let yy = -1; yy <= 1; yy += 1) {
          for (let xx = -1; xx <= 1; xx += 1) {
            if (xx === 0 && yy === 0) continue;
            const nx = (x + xx + ctx.width) % ctx.width;
            const ny = (y + yy + ctx.height) % ctx.height;
            if (!ctx.isPyramid(nx, ny)) continue;
            neighbors += grid[index(nx, ny, ctx.width)];
          }
        }
        const alive = grid[index(x, y, ctx.width)] === 1;
        next[index(x, y, ctx.width)] = neighbors === 3 || (alive && neighbors === 2) ? 1 : 0;
      }
    }

    [grid, next] = [next, grid];
    let population = 0;
    for (let i = 0; i < grid.length; i += 1) population += grid[i];
    if (population < 12 || population > grid.length * 0.85) randomize(ctx, Number(params.density));
  },
  render(framebuffer, ctx, params) {
    const palette = palettes[String(params.palette) as keyof typeof palettes] ?? palettes.signal;
    framebuffer.fade(0.72);
    for (let y = 0; y < ctx.height; y += 1) {
      for (let x = 0; x < ctx.width; x += 1) {
        if (grid[index(x, y, ctx.width)]) framebuffer.setPixel(x, y, sampleGradient(palette.colors, y / ctx.height));
      }
    }
  },
};
