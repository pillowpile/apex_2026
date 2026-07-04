function hash(x: number, y: number, seed: number) {
  let n = x * 374761393 + y * 668265263 + seed * 1442695041;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export class Noise {
  constructor(private seed = 42) {}

  value2D(x: number, y: number) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const tx = smooth(x - x0);
    const ty = smooth(y - y0);

    const a = hash(x0, y0, this.seed);
    const b = hash(x1, y0, this.seed);
    const c = hash(x0, y1, this.seed);
    const d = hash(x1, y1, this.seed);

    return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
  }

  fbm2D(x: number, y: number, octaves = 4) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let total = 0;

    for (let i = 0; i < octaves; i += 1) {
      value += this.value2D(x * frequency, y * frequency) * amplitude;
      total += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / total;
  }
}
