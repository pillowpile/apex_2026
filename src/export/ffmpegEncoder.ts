import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function loadFfmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();
  const coreURL = await toBlobURL("/ffmpeg/ffmpeg-core.js", "text/javascript");
  const wasmURL = await toBlobURL("/ffmpeg/ffmpeg-core.wasm", "application/wasm");
  await ffmpeg.load({ coreURL, wasmURL });
  return ffmpeg;
}

function getFfmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) ffmpegPromise = loadFfmpeg();
  return ffmpegPromise;
}

function frameFileName(index: number) {
  return `frame${String(index).padStart(5, "0")}.png`;
}

export async function encodePngFramesToMp4(
  frames: Uint8Array[],
  fps: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ffmpeg = await getFfmpeg();

  const onFfmpegProgress = ({ progress }: { progress: number }) => {
    onProgress?.(Math.max(0, Math.min(1, progress)));
  };
  ffmpeg.on("progress", onFfmpegProgress);

  try {
    for (let index = 0; index < frames.length; index += 1) {
      await ffmpeg.writeFile(frameFileName(index), frames[index]);
    }

    await ffmpeg.exec([
      "-framerate",
      String(fps),
      "-i",
      "frame%05d.png",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "output.mp4",
    ]);

    const data = await ffmpeg.readFile("output.mp4");
    const bytes = new Uint8Array(data as Uint8Array);
    return new Blob([bytes], { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", onFfmpegProgress);
    for (let index = 0; index < frames.length; index += 1) {
      await ffmpeg.deleteFile(frameFileName(index)).catch(() => {});
    }
    await ffmpeg.deleteFile("output.mp4").catch(() => {});
  }
}
