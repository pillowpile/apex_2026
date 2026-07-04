import { RGB } from "../engine/Framebuffer";

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function lerpColor(a: RGB, b: RGB, t: number): RGB {
  const clamped = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * clamped),
    Math.round(a[1] + (b[1] - a[1]) * clamped),
    Math.round(a[2] + (b[2] - a[2]) * clamped),
  ];
}

export function sampleGradient(colors: RGB[], t: number): RGB {
  if (colors.length === 0) return [0, 0, 0];
  if (colors.length === 1) return colors[0];
  const scaled = Math.max(0, Math.min(1, t)) * (colors.length - 1);
  const index = Math.floor(scaled);
  const next = Math.min(colors.length - 1, index + 1);
  return lerpColor(colors[index], colors[next], scaled - index);
}
