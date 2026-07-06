# PLAY/BRAIN Pixel Engine

## Final Project Description

PLAY/BRAIN Pixel Engine is a modular realtime engine for procedural pixel
animation, built for a physical installation made from a matrix of RGB
pyramids.

The physical matrix contains:

```text
69 columns x 45 rows, bounding box
minus a 21 x 5 notch cut from the top-center (columns 24-45, rows 0-5)
= 3000 real pyramids
```

Each pyramid is one RGB pixel. The notch is a real physical absence, not a
rendering choice — no pyramid exists there.

The engine is not a single artwork, animation, or projection-mapping tool. It
is a reusable creative-coding platform for building, testing, combining, and
performing many procedural pixel systems over time.

The core purpose is living animation: simulations, creatures, autonomous
systems, generative motion, visual experiments, and long-running behaviors that
can continue evolving beyond one exhibition.

## Core Concept

Every visual idea is implemented as an independent module.

Examples:

- Pixel creatures
- Procedural noise
- Flow fields
- Cellular automata
- Conway's Game of Life
- Lenia-like systems
- Reaction diffusion
- Falling sand
- Particle systems
- Pixel sorting
- Glitch systems
- Text renderer
- Clock
- Snake
- Tetris
- Maze generator
- Camera pixelation
- QR mutation

Modules do not know about projection mapping, Syphon, Spout, OBS,
TouchDesigner, Resolume, or physical output. A module only produces pixel data
for the shared logical framebuffer.

## Logical Framebuffer

The canonical engine resolution is:

```text
width: 69 pixels
height: 45 pixels
format: RGB
```

All modules render into this logical framebuffer.

The framebuffer represents the physical pyramid matrix directly:

```text
framebuffer[x][y] -> one physical RGB pyramid, if (x, y) is not in the notch
```

Cells inside the top-center notch (columns 24-45, rows 0-5) do not
correspond to any physical pyramid. The framebuffer refuses writes there, and
modules that scan the full rectangle or do wrap-around/spawn logic should
check whether a cell is real before treating it as one.

Pixels must remain crisp at every output size.

Rendering rules:

- nearest-neighbor scaling only
- no blur
- no anti-aliasing
- no smoothing
- no fractional blending between logical pixels

## 1920 x 1080 Output Rule

The primary video output target is:

```text
1920 x 1080
```

The full 69 x 45 logical grid must be visible in the 1920 x 1080 output while
preserving square pixels.

Therefore:

```text
screen pixel size = 1080 / 45 = 24 exactly
```

The full logical image becomes:

```text
output width: 69 x 24 = 1656 px
output height: 1080 px
```

The default 1080p output mode is therefore a full-grid fit viewport:

```text
canvas: 1920 x 1080
logical grid: 69 x 45
scale: 1080 / 45 = 24
active image: 1656 x 1080
horizontal position: centered
vertical position: centered
visible result: complete 69 x 45 grid (notch rendered black) with black side fields
background: black where no active image exists, including the notch
```

In this mode, preserving the full 69 x 45 square grid has priority over filling
the entire 1920 px output width.

## Module Interface

Each module should expose the same basic lifecycle:

```ts
interface PixelModule {
  id: string;
  name: string;
  parameters: ParameterSchema;

  init(ctx: ModuleContext): void;
  update(deltaTime: number, ctx: ModuleContext): void;
  render(framebuffer: Framebuffer, ctx: ModuleContext): void;
  dispose?(): void;
}
```

The engine owns timing, switching, framebuffer management, preview rendering,
UI, and outputs.

Modules own behavior.

## Module Context

Modules receive a shared context with stable utilities:

```ts
type ModuleContext = {
  width: 69;
  height: 45;
  time: number;
  frame: number;
  random: Random;
  noise: Noise;
  isPyramid: (x: number, y: number) => boolean;
  palettes: PaletteLibrary;
};
```

`isPyramid(x, y)` reports whether a cell is a real physical pyramid — false
for cells inside the top-center notch. Modules that scan the full rectangle
or do wrap-around/spawn logic should check it.

The context should make experimentation fast without forcing every module to
reimplement common tools.

Useful shared utilities:

- random number helpers
- seeded randomness
- Perlin or simplex noise
- palette lookup
- color interpolation
- draw pixel
- draw line
- draw rectangle
- draw sprite
- fade framebuffer
- copy framebuffer
- blend framebuffer
- clamp coordinates
- wrap coordinates

## Parameters

Each module exposes live-editable parameters.

Parameter changes should affect the running animation immediately whenever
possible.

Common parameter types:

```ts
type Parameter =
  | { type: "number"; min: number; max: number; step?: number; default: number }
  | { type: "boolean"; default: boolean }
  | { type: "color"; default: string }
  | { type: "palette"; default: string }
  | { type: "select"; options: string[]; default: string };
```

Example parameters:

- speed
- palette
- randomness
- simulation rate
- agent count
- fade amount
- spawn probability
- lifespan
- scale
- interaction radius
- color intensity
- trail length

The UI should be generated from the parameter schema instead of being hardcoded
per module.

## Runtime Behavior

The engine should support:

- realtime animation
- live module switching
- live parameter editing
- stable framerate where possible
- fullscreen preview
- windowed preview
- output preview
- future recording
- future presets
- future playlists

Switching modules should never require restarting the application.

Keyboard shortcuts can be used for quick module switching:

```text
1 - Pixel Creatures
2 - Noise
3 - Conway
4 - Flow Field
5 - Glitch
```

## Animation Philosophy

This is primarily an animation engine, not a drawing application.

Static images are allowed, but procedural animation is the core purpose.

Motion should range from calm and meditative to chaotic and energetic.

Modules should favor long-running behavior over short obvious loops. Different
time scales can coexist:

- breathing
- blinking
- slow drifting
- small idle motion
- rare events
- sudden bursts
- long-term evolution

Small movement can be more powerful than constant movement.

## Pixel Creatures

Pixel creatures are an important family of modules.

They should feel alive through simple behaviors such as:

- blinking
- breathing
- looking around
- walking
- sleeping
- waking up
- gathering
- separating
- reacting to neighbors
- idle behavior
- simple autonomous decision making

A creature system may eventually become a shared subsystem used by multiple
modules.

## Future Layer System

The initial engine may run one module at a time, but the architecture should
anticipate layered composition.

Future layer example:

```text
Layer 1: background noise
Layer 2: pixel creatures
Layer 3: glitch overlay
Layer 4: particles
```

Future layer model:

```ts
type Layer = {
  module: PixelModule;
  opacity: number;
  blendMode: "normal" | "add" | "multiply" | "screen";
  enabled: boolean;
};
```

The future render pipeline should be able to become:

```text
module framebuffers -> compositor -> output framebuffer -> renderer/output
```

## Output Targets

The engine should provide a clean framebuffer or video output for external
tools.

Target tools:

- TouchDesigner
- Resolume
- MadMapper
- OBS

Preferred output technologies:

- Syphon on macOS
- Spout on Windows

Fallback output technologies:

- WebSocket pixel stream
- NDI
- browser capture

The engine itself must not perform projection mapping.

Projection correction, masks, warping, and physical calibration belong in
TouchDesigner, Resolume, MadMapper, or a similar dedicated output tool.

## User Interface

The UI should be simple, direct, and expandable.

Primary layout:

```text
left: module browser
center: pixel preview
right: parameters
bottom: status bar
```

Status bar:

- FPS
- logical resolution
- output resolution
- active module
- active output

Future UI features:

- presets
- favorites
- search
- random module
- recording
- playlist mode
- module tags

## Suggested Project Structure

```text
engine/
  Engine.ts
  Framebuffer.ts
  ModuleRegistry.ts
  parameters.ts

modules/
  noise/
  conway/
  creatures/
  flow/
  glitch/
  clock/

renderer/
  CanvasRenderer.ts
  OutputScaler.ts

output/
  websocket/
  syphon/
  spout/

ui/
  ModuleBrowser.tsx
  ParameterPanel.tsx
  StatusBar.tsx

utilities/
  random.ts
  noise.ts
  color.ts
  drawing.ts

palettes/
  palettes.ts
```

Adding a new module should require minimal boilerplate.

## MVP Build Scope

The first build should focus on a working creative-coding loop, not every final
feature.

MVP requirements:

- browser-based realtime preview
- fixed 69 x 45 RGB framebuffer (notched, 3000 real pyramids)
- crisp nearest-neighbor renderer
- 1920 x 1080 full-grid fit output mode
- module registry
- live module switching
- generated parameter UI
- FPS/status display
- five starter modules

Starter modules:

- procedural noise
- Conway's Game of Life
- pixel creature
- flow particles
- clock or text renderer

MVP non-goals:

- projection mapping
- physical calibration
- advanced playlists
- multi-layer composition
- native Syphon/Spout integration
- complex preset management

These can be added after the engine loop and module interface are stable.

## Development Philosophy

The project should feel like a small creative-coding framework in the spirit of
Processing, p5.js, TouchDesigner, or openFrameworks.

Prioritize:

- readability
- modularity
- fast experimentation
- stable interfaces
- easy module creation

Avoid premature optimization unless performance becomes a real constraint.

The codebase should invite new experiments and make it easy to add dozens or
hundreds of procedural behaviors over time.
