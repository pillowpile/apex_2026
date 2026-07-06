# PLAY/BRAIN Pixel Engine

A modular, realtime, browser-based engine for procedural pixel animation, built
for a physical installation made of RGB pyramids (one pyramid = one RGB
pixel), arranged in a **69 × 45 notched matrix**: a 69×45 bounding box with a
21-wide × 5-deep notch cut from the top-center, for exactly **3,000** real
pyramids.

The engine is a creative-coding platform in the spirit of Processing, p5.js,
or TouchDesigner — not a single artwork. New visual behaviors ("modules") can
be dropped in at any time without touching the engine core.

See [PLAY_BRAIN_Pixel_Engine_Vision.md](PLAY_BRAIN_Pixel_Engine_Final_Description.md)
and [PLAY_BRAIN_Pixel_Engine_Final_Description.md](PLAY_BRAIN_Pixel_Engine_Final_Description.md)
for the full design philosophy. This README covers running the project
locally and building new modules; [CLAUDE.md](CLAUDE.md) covers the same
ground for an AI coding agent working in this repo.

## Requirements

- Node.js 18+ (Vite 6 / React 19)
- npm

## Running locally

```bash
npm install
npm run dev
```

This starts the Vite dev server (see [vite.config.ts](vite.config.ts), bound
to `0.0.0.0:5173` so it's reachable from other devices on the network, e.g. a
tablet or a second machine driving a projector). Open the printed URL in a
browser.

Other scripts:

```bash
npm run build     # tsc typecheck + production build to dist/
npm run preview   # serve the production build locally
```

There is no test suite or linter configured yet.

## Using the app

- **Module browser** (left) — click a module, or press number keys `1`–`6`
  to switch instantly. Switching never restarts the app.
- **Parameter panel** (right) — sliders/toggles/selects generated from each
  module's parameter schema; changes apply live.
- **Logical preview** — the raw 69 × 45 grid, integer-scaled, crisp
  (nearest-neighbor, no smoothing).
- **1080p output view** — the same grid fit into a 1920×1080 canvas with
  black bars, matching what you'd feed to a projector or capture card. It
  supports:
  - fullscreen (for actually driving a display)
  - corner-pin projection warp (draggable handles, persisted to
    `localStorage`) to correct for an off-axis projector
- **Transport** — play/pause (`Space`) and restart the current module.
- **Status bar** — FPS and active module name.

## Architecture

```text
engine/       Engine, Framebuffer, module registry, parameter schema/types
modules/      One folder per visual module (self-contained)
renderer/     Canvas rendering: logical preview + 1080p output framing
ui/           React UI: module browser, parameter panel, status bar, app shell
utilities/    Shared helpers: seeded random, value noise/fbm, color/gradient
palettes/     Shared named color palettes
```

**Data flow:** `Engine.tick(dt)` calls the active module's `update` then
`render`, writing into a single shared `Framebuffer` (a `69 × 45 × 3`
`Uint8ClampedArray`). `CanvasRenderer` reads that framebuffer every animation
frame and draws it into the preview canvas and the 1080p output canvas,
masking the top-center notch to black regardless of what a module wrote
there. Nothing about output devices (projectors, Syphon/Spout/NDI) lives in a
module — modules only ever produce pixel data.

### The module contract

Every module ([src/engine/types.ts](src/engine/types.ts)) is a plain object:

```ts
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
```

`ModuleContext` ([src/engine/types.ts](src/engine/types.ts)) hands every
module the same shared toolkit: fixed `width`/`height` (69/45), running
`time`/`frame` counters, a seeded `random`, a `noise` (value noise + fbm),
`isPyramid(x, y)` (true if that cell is a real pyramid, false inside the
notch), and the `palettes` library. Modules should stay pure with respect to
these — no DOM access, no globals beyond module-local state (see the `let
grid` pattern in [conwayModule.ts](src/modules/conway/conwayModule.ts) for
how modules keep their own instance state between `init`/`update`/`render`
calls). Any module that scans the full rectangle or does wrap-around/spawn
logic should guard with `ctx.isPyramid(x, y)` so the notch behaves like real
absence, not just an invisible cell — see `conwayModule.ts` and
`flowModule.ts` for the established pattern.

### Adding a new module

1. Create `src/modules/<name>/<name>Module.ts`.
2. Define a `PixelModule` object: pick an `id`, `name`, `description`, and a
   `parameters` schema (`number` / `boolean` / `color` / `select` / `palette`
   entries — see [src/engine/parameters.ts](src/engine/parameters.ts)). The
   parameter panel UI is generated automatically from this schema, no UI code
   needed.
3. Implement `render` (required) and optionally `init`/`update`/`dispose`.
   Use `framebuffer.setPixel`/`addPixel`/`fillRect`/`fade`
   ([src/engine/Framebuffer.ts](src/engine/Framebuffer.ts)) to draw, and
   `ctx.random` / `ctx.noise` / `ctx.palettes` for procedural variation.
4. Register it in [src/engine/modules.ts](src/engine/modules.ts) by adding it
   to the `starterModules` array — this is the single place that wires a
   module into the module browser and keyboard shortcuts.

Look at [noiseModule.ts](src/modules/noise/noiseModule.ts) for the simplest
possible module, and [creatureModule.ts](src/modules/creatures/creatureModule.ts)
or [conwayModule.ts](src/modules/conway/conwayModule.ts) for ones with
persistent per-module state and a fixed simulation rate independent of
render/frame rate.

## Extending with more visual modules

The vision docs list a large backlog of module ideas that aren't built yet:
Lenia, reaction-diffusion, falling sand, particle/flocking systems, pixel
sorting, glitch/QR mutation, Mondrian generator, Tetris/Snake, maze
generator, camera pixelation, text renderer. Any of these can be added
following the "Adding a new module" steps above — the engine, renderer, and
UI need no changes to support a new module.

Two extension points to know about if you go beyond a single new module:

- **Shared subsystems** — if several modules want the same behavior (e.g. a
  "pixel creature" subsystem reused by multiple modules), factor it into
  `utilities/` rather than duplicating logic across module files.
- **Layer/compositing system (not yet implemented)** — the vision docs
  describe running multiple modules simultaneously with blend modes
  (normal/add/multiply/screen). Today the engine runs exactly one active
  module at a time (`Engine.activeModule`); building a layer stack would mean
  giving each module its own framebuffer and adding a compositor step before
  `CanvasRenderer` runs. Not required to add new individual modules.

Also not yet implemented, per the vision docs: Syphon/Spout/NDI/WebSocket
output, presets/favorites/search/random-module UI, and recording.
