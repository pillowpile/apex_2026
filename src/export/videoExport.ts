import { Engine } from "../engine/Engine";
import { ParameterValues } from "../engine/parameters";
import { PixelModule } from "../engine/types";
import { CanvasRenderer } from "../renderer/CanvasRenderer";
import { encodePngFramesToMp4 } from "./ffmpegEncoder";

export type ExportProgress =
  | { phase: "rendering"; frame: number; totalFrames: number }
  | { phase: "encoding"; progress: number };

export type ExportOptions = {
  modules: PixelModule[];
  moduleId: string;
  parameters: ParameterValues;
  durationSeconds: number;
  fps: number;
  width: number;
  height: number;
  signal?: AbortSignal;
  onProgress?: (progress: ExportProgress) => void;
};

function toEvenDimension(value: number): number {
  const rounded = Math.max(2, Math.round(value));
  return rounded % 2 === 0 ? rounded : rounded - 1;
}

async function yieldToBrowser() {
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
}

export async function renderModuleToMp4(options: ExportOptions): Promise<Blob> {
  const { modules, moduleId, parameters, durationSeconds, fps, signal, onProgress } = options;
  const width = toEvenDimension(options.width);
  const height = toEvenDimension(options.height);

  const engine = new Engine(modules);
  engine.setModule(moduleId);
  for (const [key, value] of Object.entries(parameters)) {
    engine.setParameter(key, value);
  }

  const renderer = new CanvasRenderer();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create export canvas context.");

  const totalFrames = Math.max(1, Math.round(durationSeconds * fps));
  const frames: Uint8Array[] = [];

  for (let frame = 0; frame < totalFrames; frame += 1) {
    if (signal?.aborted) throw new DOMException("Export cancelled", "AbortError");

    engine.tick(1 / fps);
    renderer.renderOutput1080(canvas, engine.framebuffer);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Failed to capture export frame.");
    frames.push(new Uint8Array(await blob.arrayBuffer()));

    onProgress?.({ phase: "rendering", frame: frame + 1, totalFrames });
    await yieldToBrowser();
  }

  if (signal?.aborted) throw new DOMException("Export cancelled", "AbortError");

  return encodePngFramesToMp4(frames, fps, (progress) => {
    onProgress?.({ phase: "encoding", progress });
  });
}
