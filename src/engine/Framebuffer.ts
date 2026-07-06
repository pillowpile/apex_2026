export const LOGICAL_WIDTH = 69;
export const LOGICAL_HEIGHT = 45;

const NOTCH_X_START = 24;
const NOTCH_WIDTH = 21;
const NOTCH_HEIGHT = 5;

export function isPyramidPixel(x: number, y: number): boolean {
  if (x < 0 || x >= LOGICAL_WIDTH || y < 0 || y >= LOGICAL_HEIGHT) return false;
  const inNotch = y < NOTCH_HEIGHT && x >= NOTCH_X_START && x < NOTCH_X_START + NOTCH_WIDTH;
  return !inNotch;
}

export type RGB = [number, number, number];

export class Framebuffer {
  readonly width = LOGICAL_WIDTH;
  readonly height = LOGICAL_HEIGHT;
  readonly data = new Uint8ClampedArray(this.width * this.height * 3);

  clear(color: RGB = [0, 0, 0]) {
    for (let i = 0; i < this.data.length; i += 3) {
      this.data[i] = color[0];
      this.data[i + 1] = color[1];
      this.data[i + 2] = color[2];
    }
  }

  fade(amount: number) {
    const keep = Math.max(0, Math.min(1, amount));
    for (let i = 0; i < this.data.length; i += 1) {
      this.data[i] *= keep;
    }
  }

  setPixel(x: number, y: number, color: RGB) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (!isPyramidPixel(ix, iy)) return;
    const index = (iy * this.width + ix) * 3;
    this.data[index] = color[0];
    this.data[index + 1] = color[1];
    this.data[index + 2] = color[2];
  }

  addPixel(x: number, y: number, color: RGB, alpha = 1) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (!isPyramidPixel(ix, iy)) return;
    const index = (iy * this.width + ix) * 3;
    this.data[index] = Math.min(255, this.data[index] + color[0] * alpha);
    this.data[index + 1] = Math.min(255, this.data[index + 1] + color[1] * alpha);
    this.data[index + 2] = Math.min(255, this.data[index + 2] + color[2] * alpha);
  }

  fillRect(x: number, y: number, width: number, height: number, color: RGB) {
    for (let yy = y; yy < y + height; yy += 1) {
      for (let xx = x; xx < x + width; xx += 1) {
        this.setPixel(xx, yy, color);
      }
    }
  }
}
