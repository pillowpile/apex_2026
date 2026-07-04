import { Framebuffer } from "./Framebuffer";
import { ParameterSchema, ParameterValues } from "./parameters";
import { PaletteLibrary } from "../palettes/palettes";
import { Noise } from "../utilities/noise";
import { Random } from "../utilities/random";

export type ModuleContext = {
  width: 68;
  height: 44;
  time: number;
  frame: number;
  random: Random;
  noise: Noise;
  palettes: PaletteLibrary;
};

export type PixelModule = {
  id: string;
  name: string;
  description: string;
  parameters: ParameterSchema;
  init?: (ctx: ModuleContext, params: ParameterValues) => void;
  update?: (deltaTime: number, ctx: ModuleContext, params: ParameterValues) => void;
  render: (framebuffer: Framebuffer, ctx: ModuleContext, params: ParameterValues) => void;
  dispose?: () => void;
};
