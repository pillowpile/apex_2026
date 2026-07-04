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
  reef: {
    name: "Reef",
    colors: [
      [0, 14, 22],
      [0, 137, 123],
      [64, 224, 208],
      [246, 247, 210],
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
} satisfies Record<string, Palette>;

export type PaletteName = keyof typeof palettes;
export type PaletteLibrary = typeof palettes;

export const paletteNames = Object.keys(palettes);
