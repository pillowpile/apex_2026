import { Framebuffer, isPyramidPixel, LOGICAL_HEIGHT, LOGICAL_WIDTH } from "./Framebuffer";
import { getDefaultParameters, ParameterValues } from "./parameters";
import { ModuleContext, PixelModule } from "./types";
import { Noise } from "../utilities/noise";
import { Random } from "../utilities/random";
import { palettes } from "../palettes/palettes";

export class Engine {
  readonly framebuffer = new Framebuffer();
  readonly modules: PixelModule[];
  private activeModule: PixelModule;
  private params: ParameterValues;
  private time = 0;
  private frame = 0;
  private random = new Random();
  private noise = new Noise();

  constructor(modules: PixelModule[]) {
    if (modules.length === 0) throw new Error("Engine requires at least one module.");
    this.modules = modules;
    this.activeModule = modules[0];
    this.params = getDefaultParameters(this.activeModule.parameters);
    this.activeModule.init?.(this.context, this.params);
  }

  get active() {
    return this.activeModule;
  }

  get parameters() {
    return this.params;
  }

  get context(): ModuleContext {
    return {
      width: LOGICAL_WIDTH,
      height: LOGICAL_HEIGHT,
      time: this.time,
      frame: this.frame,
      random: this.random,
      noise: this.noise,
      isPyramid: isPyramidPixel,
      palettes,
    };
  }

  setModule(id: string) {
    const next = this.modules.find((module) => module.id === id);
    if (!next || next.id === this.activeModule.id) return;
    this.activeModule.dispose?.();
    this.framebuffer.clear();
    this.activeModule = next;
    this.params = getDefaultParameters(next.parameters);
    this.random.reset();
    next.init?.(this.context, this.params);
  }

  setParameter(key: string, value: number | boolean | string) {
    this.params = { ...this.params, [key]: value };
  }

  tick(deltaTime: number) {
    this.time += deltaTime;
    this.frame += 1;
    const context = this.context;
    this.activeModule.update?.(deltaTime, context, this.params);
    this.activeModule.render(this.framebuffer, context, this.params);
  }
}
