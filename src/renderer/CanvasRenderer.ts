import { Framebuffer, isPyramidPixel, LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/Framebuffer";

export class CanvasRenderer {
  private sourceCanvas = document.createElement("canvas");
  private sourceContext: CanvasRenderingContext2D;
  private imageData: ImageData;

  constructor() {
    this.sourceCanvas.width = LOGICAL_WIDTH;
    this.sourceCanvas.height = LOGICAL_HEIGHT;
    const context = this.sourceCanvas.getContext("2d");
    if (!context) throw new Error("Could not create source canvas context.");
    this.sourceContext = context;
    this.imageData = context.createImageData(LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }

  renderPreview(canvas: HTMLCanvasElement, framebuffer: Framebuffer) {
    this.writeSource(framebuffer);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const scale = Math.floor(
      Math.min(canvas.width / LOGICAL_WIDTH, canvas.height / LOGICAL_HEIGHT),
    );
    const width = LOGICAL_WIDTH * scale;
    const height = LOGICAL_HEIGHT * scale;
    const x = Math.floor((canvas.width - width) / 2);
    const y = Math.floor((canvas.height - height) / 2);
    context.drawImage(this.sourceCanvas, x, y, width, height);
  }

  renderOutput1080(canvas: HTMLCanvasElement, framebuffer: Framebuffer) {
    this.writeSource(framebuffer);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const scale = Math.min(canvas.width / LOGICAL_WIDTH, canvas.height / LOGICAL_HEIGHT);
    const width = LOGICAL_WIDTH * scale;
    const height = LOGICAL_HEIGHT * scale;
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;
    context.drawImage(this.sourceCanvas, x, y, width, height);
  }

  private writeSource(framebuffer: Framebuffer) {
    for (let y = 0; y < LOGICAL_HEIGHT; y += 1) {
      for (let x = 0; x < LOGICAL_WIDTH; x += 1) {
        const source = (y * LOGICAL_WIDTH + x) * 3;
        const target = (y * LOGICAL_WIDTH + x) * 4;
        const active = isPyramidPixel(x, y);
        this.imageData.data[target] = active ? framebuffer.data[source] : 0;
        this.imageData.data[target + 1] = active ? framebuffer.data[source + 1] : 0;
        this.imageData.data[target + 2] = active ? framebuffer.data[source + 2] : 0;
        this.imageData.data[target + 3] = 255;
      }
    }
    this.sourceContext.putImageData(this.imageData, 0, 0);
  }
}
