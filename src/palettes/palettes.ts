import { RGB } from "../engine/Framebuffer";

export type Palette = {
  name: string;
  colors: RGB[];
};

export const palettes = {
  ember: {
    name: "Ember",
    colors: [
      [12, 7, 10],
      [180, 38, 38],
      [255, 138, 48],
      [255, 226, 120],
    ],
  },
  colorful: {
    name: "Colorful",
    colors: [
      [217, 37, 52],
      [32, 114, 178],
      [11, 140, 80],
      [242, 227, 15],
      [242, 131, 34],
    ],
  },
  orchard: {
    name: "Orchard",
    colors: [
      [10, 18, 12],
      [64, 142, 83],
      [190, 208, 95],
      [247, 166, 88],
    ],
  },
  signal: {
    name: "Signal",
    colors: [
      [3, 3, 5],
      [36, 83, 164],
      [228, 54, 95],
      [238, 232, 88],
    ],
  },
  vivid: {
    name: "Vivid",
    colors: [
      [0, 223, 252],
      [0, 8, 234],
      [99, 255, 0],
      [255, 147, 0],
      [255, 0, 121],
    ],
  },
  violetVaporwave: {
    name: "Violet Vaporwave",
    colors: [
      [6, 1, 38],
      [59, 0, 82],
      [242, 29, 145],
      [223, 49, 235],
      [25, 179, 255],
    ],
  },
} satisfies Record<string, Palette>;

export type PaletteName = keyof typeof palettes;
export type PaletteLibrary = typeof palettes;

export const paletteNames = Object.keys(palettes);
