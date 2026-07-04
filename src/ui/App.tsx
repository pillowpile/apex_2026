import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Maximize2, Minimize2, Pause, Play, Pointer, RotateCcw } from "lucide-react";
import { Engine } from "../engine/Engine";
import { starterModules } from "../engine/modules";
import { ParameterValues } from "../engine/parameters";
import { CanvasRenderer } from "../renderer/CanvasRenderer";
import { ModuleBrowser } from "./ModuleBrowser";
import { ParameterPanel } from "./ParameterPanel";
import { StatusBar } from "./StatusBar";

type CornerName = "topLeft" | "topRight" | "bottomRight" | "bottomLeft";
type ProjectionCorner = { x: number; y: number };
type ProjectionCorners = Record<CornerName, ProjectionCorner>;
type OutputBounds = { width: number; height: number };

const projectionStorageKey = "play-brain-projection-corners";

const defaultProjectionCorners: ProjectionCorners = {
  topLeft: { x: 0, y: 0 },
  topRight: { x: 1, y: 0 },
  bottomRight: { x: 1, y: 1 },
  bottomLeft: { x: 0, y: 1 },
};

const cornerLabels: Record<CornerName, string> = {
  topLeft: "Top left",
  topRight: "Top right",
  bottomRight: "Bottom right",
  bottomLeft: "Bottom left",
};

const cornerOrder: CornerName[] = ["topLeft", "topRight", "bottomRight", "bottomLeft"];

function loadProjectionCorners() {
  if (typeof window === "undefined") return defaultProjectionCorners;

  try {
    const stored = window.localStorage.getItem(projectionStorageKey);
    if (!stored) return defaultProjectionCorners;
    const parsed = JSON.parse(stored) as Partial<ProjectionCorners>;
    return {
      topLeft: normalizeCorner(parsed.topLeft, defaultProjectionCorners.topLeft),
      topRight: normalizeCorner(parsed.topRight, defaultProjectionCorners.topRight),
      bottomRight: normalizeCorner(parsed.bottomRight, defaultProjectionCorners.bottomRight),
      bottomLeft: normalizeCorner(parsed.bottomLeft, defaultProjectionCorners.bottomLeft),
    };
  } catch {
    return defaultProjectionCorners;
  }
}

function normalizeCorner(value: ProjectionCorner | undefined, fallback: ProjectionCorner) {
  if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y)) return fallback;
  return {
    x: clampProjection(value.x),
    y: clampProjection(value.y),
  };
}

function clampProjection(value: number) {
  return Math.max(0, Math.min(1, value));
}

function projectionMatrix(bounds: OutputBounds, corners: ProjectionCorners) {
  if (bounds.width <= 0 || bounds.height <= 0) return "none";

  const source = [
    [0, 0],
    [bounds.width, 0],
    [bounds.width, bounds.height],
    [0, bounds.height],
  ];
  const target = cornerOrder.map((corner) => [
    corners[corner].x * bounds.width,
    corners[corner].y * bounds.height,
  ]);

  const matrix = solveProjectiveTransform(source, target);
  if (!matrix) return "none";
  const [a, b, c, d, e, f, g, h] = matrix;
  return `matrix3d(${a}, ${d}, 0, ${g}, ${b}, ${e}, 0, ${h}, 0, 0, 1, 0, ${c}, ${f}, 0, 1)`;
}

function solveProjectiveTransform(source: number[][], target: number[][]) {
  const equations = source.flatMap(([x, y], index) => {
    const [u, v] = target[index];
    return [
      [x, y, 1, 0, 0, 0, -u * x, -u * y, u],
      [0, 0, 0, x, y, 1, -v * x, -v * y, v],
    ];
  });

  for (let column = 0; column < 8; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < 8; row += 1) {
      if (Math.abs(equations[row][column]) > Math.abs(equations[pivot][column])) pivot = row;
    }
    if (Math.abs(equations[pivot][column]) < 1e-8) return null;
    [equations[column], equations[pivot]] = [equations[pivot], equations[column]];

    const divisor = equations[column][column];
    for (let col = column; col < 9; col += 1) equations[column][col] /= divisor;

    for (let row = 0; row < 8; row += 1) {
      if (row === column) continue;
      const factor = equations[row][column];
      for (let col = column; col < 9; col += 1) {
        equations[row][col] -= factor * equations[column][col];
      }
    }
  }

  return equations.map((row) => row[8]);
}

export function App() {
  const engine = useMemo(() => new Engine(starterModules), []);
  const renderer = useMemo(() => new CanvasRenderer(), []);
  const previewCanvas = useRef<HTMLCanvasElement | null>(null);
  const outputCanvas = useRef<HTMLCanvasElement | null>(null);
  const outputCanvasFrame = useRef<HTMLDivElement | null>(null);
  const outputPreview = useRef<HTMLElement | null>(null);
  const [activeId, setActiveId] = useState(engine.active.id);
  const [parameters, setParameters] = useState<ParameterValues>(engine.parameters);
  const [fps, setFps] = useState(0);
  const [running, setRunning] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [projectionEditing, setProjectionEditing] = useState(false);
  const [projectionCorners, setProjectionCorners] = useState<ProjectionCorners>(loadProjectionCorners);
  const [outputBounds, setOutputBounds] = useState<OutputBounds>({ width: 0, height: 0 });

  useEffect(() => {
    let animationFrame = 0;
    let previous = performance.now();
    let fpsPrevious = previous;
    let frames = 0;

    const tick = (now: number) => {
      const delta = Math.min(0.05, (now - previous) / 1000);
      previous = now;

      if (running) {
        engine.tick(delta);
      }

      if (previewCanvas.current) renderer.renderPreview(previewCanvas.current, engine.framebuffer);
      if (outputCanvas.current) renderer.renderOutput1080(outputCanvas.current, engine.framebuffer);

      frames += 1;
      if (now - fpsPrevious >= 500) {
        setFps((frames * 1000) / (now - fpsPrevious));
        frames = 0;
        fpsPrevious = now;
      }

      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [engine, renderer, running]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && starterModules[index]) {
        selectModule(starterModules[index].id);
      }
      if (event.code === "Space") {
        event.preventDefault();
        setRunning((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === outputPreview.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(projectionStorageKey, JSON.stringify(projectionCorners));
  }, [projectionCorners]);

  useEffect(() => {
    const frame = outputCanvasFrame.current;
    if (!frame) return;

    const updateBounds = () => {
      const rect = frame.getBoundingClientRect();
      setOutputBounds({ width: rect.width, height: rect.height });
    };

    updateBounds();
    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(frame);
    window.addEventListener("resize", updateBounds);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateBounds);
    };
  }, []);

  function selectModule(id: string) {
    engine.setModule(id);
    setActiveId(engine.active.id);
    setParameters({ ...engine.parameters });
  }

  function changeParameter(key: string, value: number | boolean | string) {
    engine.setParameter(key, value);
    setParameters({ ...engine.parameters, [key]: value });
  }

  function restartModule() {
    const id = engine.active.id;
    const previous = starterModules[(starterModules.findIndex((module) => module.id === id) + 1) % starterModules.length].id;
    engine.setModule(previous);
    engine.setModule(id);
    setActiveId(engine.active.id);
    setParameters({ ...engine.parameters });
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement === outputPreview.current) {
      await document.exitFullscreen();
      return;
    }

    await outputPreview.current?.requestFullscreen();
  }

  function resetProjectionCorners() {
    setProjectionCorners(defaultProjectionCorners);
  }

  function beginCornerDrag(corner: CornerName, event: ReactPointerEvent<HTMLButtonElement>) {
    const frame = outputCanvasFrame.current;
    if (!frame) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const moveCorner = (clientX: number, clientY: number) => {
      const rect = frame.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      setProjectionCorners((current) => ({
        ...current,
        [corner]: {
          x: clampProjection((clientX - rect.left) / rect.width),
          y: clampProjection((clientY - rect.top) / rect.height),
        },
      }));
    };

    moveCorner(event.clientX, event.clientY);

    const onPointerMove = (moveEvent: PointerEvent) => moveCorner(moveEvent.clientX, moveEvent.clientY);
    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  const outputTransform = projectionMatrix(outputBounds, projectionCorners);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>PLAY/BRAIN Pixel Engine</h1>
          <p>Modular procedural pixel animation for a 68 x 44 RGB square matrix.</p>
        </div>
        <div className="transport">
          <button aria-label={running ? "Pause animation" : "Play animation"} onClick={() => setRunning((value) => !value)} type="button">
            {running ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button aria-label="Restart active module" onClick={restartModule} type="button">
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      <main className="workspace">
        <ModuleBrowser modules={starterModules} activeId={activeId} onSelect={selectModule} />

        <section className="stage">
          <div className="stage-header">
            <span>{engine.active.name}</span>
            <strong>Full 68 x 44 output</strong>
          </div>

          <div className="preview-stack">
            <section className="preview-block">
              <div className="preview-title">
                <span>Logical Preview</span>
                <small>Full 68 x 44 grid, integer scaled</small>
              </div>
              <canvas ref={previewCanvas} width={1020} height={660} />
            </section>

            <section className="preview-block output-preview" ref={outputPreview}>
              <div className="preview-title">
                <span>1080p Output View</span>
                <div className="preview-actions">
                  <small>Full grid, square pixels, black side fields</small>
                  <button
                    aria-pressed={projectionEditing}
                    aria-label={projectionEditing ? "Hide corner pin controls" : "Show corner pin controls"}
                    onClick={() => setProjectionEditing((value) => !value)}
                    title={projectionEditing ? "Hide corner pins" : "Corner pins"}
                    type="button"
                  >
                    <Pointer size={16} />
                  </button>
                  <button
                    aria-label="Reset corner pins"
                    onClick={resetProjectionCorners}
                    title="Reset corner pins"
                    type="button"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    aria-label={fullscreen ? "Exit fullscreen output view" : "Play output view fullscreen"}
                    onClick={toggleFullscreen}
                    title={fullscreen ? "Exit fullscreen" : "Play fullscreen"}
                    type="button"
                  >
                    {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </div>
              </div>
              <div className="output-canvas-frame" ref={outputCanvasFrame}>
                <canvas
                  className="output-canvas"
                  ref={outputCanvas}
                  style={{ transform: outputTransform }}
                  width={1920}
                  height={1080}
                />
                {projectionEditing ? (
                  <div className="projection-overlay" aria-label="Corner pin controls">
                    <svg className="projection-outline" viewBox={`0 0 ${outputBounds.width || 1} ${outputBounds.height || 1}`}>
                      <polygon
                        points={cornerOrder
                          .map((corner) => `${projectionCorners[corner].x * (outputBounds.width || 1)},${projectionCorners[corner].y * (outputBounds.height || 1)}`)
                          .join(" ")}
                      />
                    </svg>
                    {cornerOrder.map((corner) => (
                      <button
                        aria-label={`${cornerLabels[corner]} corner pin`}
                        className="projection-handle"
                        key={corner}
                        onPointerDown={(event) => beginCornerDrag(corner, event)}
                        style={{
                          left: `${projectionCorners[corner].x * 100}%`,
                          top: `${projectionCorners[corner].y * 100}%`,
                        }}
                        title={`${cornerLabels[corner]} corner`}
                        type="button"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="projection-toolbar" aria-label="Projection controls">
                <button
                  aria-pressed={projectionEditing}
                  aria-label={projectionEditing ? "Hide corner pin controls" : "Show corner pin controls"}
                  onClick={() => setProjectionEditing((value) => !value)}
                  title={projectionEditing ? "Hide corner pins" : "Corner pins"}
                  type="button"
                >
                  <Pointer size={17} />
                </button>
                <button aria-label="Reset corner pins" onClick={resetProjectionCorners} title="Reset corner pins" type="button">
                  <RotateCcw size={17} />
                </button>
                <button
                  aria-label={fullscreen ? "Exit fullscreen output view" : "Play output view fullscreen"}
                  onClick={toggleFullscreen}
                  title={fullscreen ? "Exit fullscreen" : "Play fullscreen"}
                  type="button"
                >
                  {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                </button>
              </div>
            </section>
          </div>
        </section>

        <ParameterPanel schema={engine.active.parameters} values={parameters} onChange={changeParameter} />
      </main>

      <StatusBar fps={fps} activeModule={engine.active.name} />
    </div>
  );
}
