# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## What this project is

PLAY/BRAIN Pixel Engine — a modular, realtime, browser-based engine for
procedural pixel animation, targeting a physical installation built from a
**68 × 44 matrix of RGB pyramids** (one pyramid = one RGB pixel). It's a
creative-coding platform (think Processing / p5.js / TouchDesigner), not a
single artwork: the whole point is that new self-contained visual "modules"
keep getting added over time.

Full design intent lives in
[PLAY_BRAIN_Pixel_Engine_Vision.md](PLAY_BRAIN_Pixel_Engine_Vision.md) and
[PLAY_BRAIN_Pixel_Engine_Final_Description.md](PLAY_BRAIN_Pixel_Engine_Final_Description.md).
Read those before making architectural changes — a lot of "future" behavior
(layers/blend modes, Syphon/Spout/NDI output, presets) is intentionally
deferred and described there, not a gap to silently fill in.

## Stack

React 19 + TypeScript (strict) + Vite 6. No test runner, no linter/formatter
configured — don't invent one unprompted. `npm run build` runs `tsc` (noEmit)
then `vite build`, so a broken type is the closest thing to a CI gate here.

```bash
npm install
npm run dev       # dev server on 0.0.0.0:5173
npm run build     # tsc typecheck + production bundle
npm run preview   # serve the production build
```

## Architecture (read this before touching engine/ or renderer/)

```
engine/       Engine.ts (tick loop, active module, params), Framebuffer.ts
              (68x44x3 Uint8ClampedArray + draw primitives), modules.ts
              (module registry array), parameters.ts (schema types + UI
              defaults), types.ts (PixelModule, ModuleContext contracts)
modules/      One directory per visual module: clock/, conway/, creatures/,
              flow/, neonBars/, noise/. Each exports a single PixelModule.
renderer/     CanvasRenderer.ts — draws the framebuffer into the logical
              preview canvas (integer nearest-neighbor scale) and the
              1920x1080 output canvas (full-grid-fit, centered, black bars)
ui/           React shell: App.tsx (transport, canvases, fullscreen,
              corner-pin projection warp), ModuleBrowser.tsx,
              ParameterPanel.tsx, StatusBar.tsx
utilities/    random.ts (seeded LCG), noise.ts (value noise + fbm), color.ts
              (hex->rgb, lerp, gradient sampling)
palettes/     palettes.ts — named RGB gradient palettes shared across modules
```

**Render pipeline:** `Engine.tick(dt)` → active module's `update` then
`render`, writing into the single shared `Framebuffer`. `CanvasRenderer`
reads that framebuffer each animation frame for both preview and output
canvases. Only one module is active at a time (`Engine.activeModule`); there
is no compositor/layer stack yet (see Vision doc — anticipated, not built).

**Modules must stay pure with respect to the DOM/output.** A module never
knows about projection, Syphon/Spout, fullscreen, or canvas sizing — it only
ever writes pixels into the `Framebuffer` it's given. All of that lives in
`renderer/` and `ui/App.tsx`.

## The module contract

```ts
// src/engine/types.ts
type PixelModule = {
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

`ModuleContext` gives every module: fixed `width`/`height` (68/44), running
`time`/`frame`, a seeded `random` (`Random`, resets on module switch), `noise`
(`value2D`/`fbm2D`), and `palettes`. Modules keep their own state as
module-scope `let` variables reset in `init` (see
[conwayModule.ts](src/modules/conway/conwayModule.ts) — this is the
established pattern, not a workaround).

### Adding a new module — the only workflow that matters here

1. New file: `src/modules/<name>/<name>Module.ts`, exporting one
   `PixelModule` const.
2. Declare `parameters` using the schema types in
   [parameters.ts](src/engine/parameters.ts)
   (`number`/`boolean`/`color`/`select`/`palette`). The parameter panel is
   generated from this schema — never hand-write per-module UI.
3. Implement `render` (required); add `init`/`update`/`dispose` only if the
   module needs persistent state or its own timestep.
4. Add one line to the `starterModules` array in
   [src/engine/modules.ts](src/engine/modules.ts). This is the single
   registration point — it drives the module browser list and the `1`-`N`
   keyboard shortcuts in `App.tsx` simultaneously.

Nothing in `engine/`, `renderer/`, or `ui/` should need to change to add a
module. If a change there feels necessary to make a new module work, that's
a sign to reconsider the module's design first.

Reference modules by complexity:
- [noiseModule.ts](src/modules/noise/noiseModule.ts) — stateless, `render`
  only, fbm noise sampled into a palette gradient.
- [conwayModule.ts](src/modules/conway/conwayModule.ts) /
  [creatureModule.ts](src/modules/creatures/creatureModule.ts) — persistent
  module-scope state, fixed simulation rate decoupled from render rate via an
  accumulator in `update`.

## Extending toward more visual modules

The vision docs list a large backlog not yet built: Lenia, reaction
diffusion, falling sand, particle/flocking systems, pixel sorting,
glitch/QR mutation, Mondrian generator, Tetris, Snake, maze generator,
camera pixelation, text renderer. Building any of these is just "Adding a
new module" above — no engine changes needed.

If a request implies functionality beyond a single module:
- **Shared behavior across modules** (e.g. a reusable creature/agent
  subsystem) → put it in `utilities/`, imported by each module, not
  duplicated per-module and not pushed into `engine/`.
- **Running multiple modules at once / blend modes** → this is the
  documented-but-unbuilt layer system (see Vision docs, "Future Layer
  System"). It requires giving each module its own framebuffer plus a
  compositor stage ahead of `CanvasRenderer`. Treat this as a deliberate,
  larger architectural change — confirm scope before starting rather than
  bolting a partial version onto the single-active-module model.
- **External output** (Syphon/Spout/NDI/OBS capture) → explicitly out of
  scope for the engine itself per the vision docs; the engine only needs to
  expose a clean framebuffer/canvas for external capture, never perform
  projection mapping itself.

## Conventions observed in this codebase

- Double-quoted strings, semicolons, 2-space indent, trailing commas —
  match existing files, there's no formatter to fall back on.
- No comments in module/engine code; identifiers and small functions carry
  the meaning (see any file in `modules/` or `utilities/`).
- Parameter values arrive as `ParameterValues` (`number | boolean | string`)
  and are narrowed with `Number(...)`/`String(...)` at point of use inside
  modules — don't add a separate typed-config layer.
- Framebuffer coordinates: `(0,0)` top-left, `x` in `[0, 68)`, `y` in
  `[0, 44)`. `setPixel`/`fillRect` clip silently out of range; `addPixel`
  clamps additive color to 255.
