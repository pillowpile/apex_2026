# PLAY/BRAIN Pixel Engine

*A modular platform for procedural pixel animation and experimentation.*

## Vision

This project is **not a single artwork** and **not a single animation**.

It is a long-term creative platform for building, testing and presenting
procedural pixel-based systems for a physical installation.

The installation consists of a **45 × 69 notched matrix of squares** — a
69 × 45 bounding box with a 21-wide × 5-deep notch cut from the top-center,
for exactly **3,000** real pyramids — where every pyramid represents exactly
one RGB pixel.

The engine should become an expandable playground where new behaviors,
simulations, creatures and visual experiments can be added indefinitely.

The emphasis is on **experimentation**, **emergent behaviour**, and
**living animation systems**, not on producing static graphics.

------------------------------------------------------------------------

# Core Principles

## Modular Architecture

Every visual idea is an independent module.

Examples:

-   Pixel Characters
-   Pixel Painter
-   Conway's Game of Life
-   Lenia
-   Cellular Automata
-   Reaction Diffusion
-   Falling Sand
-   Flow Fields
-   Particle Systems
-   Pixel Sorting
-   Procedural Noise
-   Mondrian Generator
-   Tetris
-   Snake
-   Maze Generator
-   QR Mutation
-   Compression Artifacts
-   Pareidolia
-   Camera Pixelation
-   Text Renderer
-   Clock

Modules should know nothing about projection mapping or output devices.

They only generate animated pixel data.

------------------------------------------------------------------------

## Common Module Interface

Every module should expose a common API similar to:

``` ts
init()
update(deltaTime)
render()
parameters
```

Output:

``` ts
RGB[45][69]
```

Cells inside the top-center notch (columns 24-45, rows 0-5) are not real
pyramids; modules that scan the full rectangle or wrap/spawn across it should
check `isPyramid(x, y)` rather than assuming every cell is drawable.

Every module should therefore be interchangeable.

------------------------------------------------------------------------

# Animation Philosophy

This is primarily an **animation engine**, not a drawing application.

Every module should evolve over time.

Static images are acceptable, but procedural animation is the core
purpose.

Animations should range from calm, meditative motion to energetic and
chaotic simulations.

## Pixel Creatures

Characters should feel alive.

Possible behaviours include:

-   blinking
-   breathing
-   looking around
-   walking
-   sleeping
-   waking up
-   gathering
-   separating
-   reacting to neighbours
-   idle behaviours
-   simple autonomous decision making

Small movements are often more interesting than constant motion.

------------------------------------------------------------------------

## Procedural Motion

Support sophisticated animation algorithms such as:

-   Perlin Noise
-   Simplex Noise
-   Curl Noise
-   Flow Fields
-   Cellular Automata
-   Lenia
-   Particle Systems
-   Flocking
-   Growth Algorithms
-   Emergent Behaviour
-   Diffusion
-   Wave Propagation
-   Recursive Systems
-   Agent Simulations

Motion should feel organic rather than repetitive.

------------------------------------------------------------------------

## Temporal Behaviour

Avoid short looping animations whenever possible.

Many modules should evolve continuously and produce long-running,
non-repeating behaviour.

Different time scales may coexist:

-   subtle breathing
-   slow drifting
-   rare events
-   sudden bursts
-   long-term evolution

------------------------------------------------------------------------

# Live Module Switching

Switch between modules instantly.

Example:

1 Characters

2 Noise

3 Conway

4 Flow

5 Glitch

Switching should never require restarting the application.

Future transitions between modules are encouraged.

------------------------------------------------------------------------

# Parameters

Each module exposes editable parameters.

Examples:

-   speed
-   palette
-   randomness
-   simulation rate
-   number of agents
-   fade
-   probability
-   lifespan
-   scale
-   interaction radius

Changing parameters should immediately affect the animation.

------------------------------------------------------------------------

# Layer System (Future)

The architecture should anticipate layered composition.

Multiple modules should eventually run simultaneously.

Example:

Background Noise

-   

Pixel Creatures

-   

Glitch Overlay

-   

Particle Layer

Support future blend modes such as:

-   Normal
-   Add
-   Multiply
-   Screen

------------------------------------------------------------------------

# Rendering

All modules render into one shared framebuffer.

Logical resolution:

**45 × 69 pixels** (notched — see Vision section above; 3,000 real pyramids)

Pixels should always remain crisp.

Nearest-neighbour scaling only.

No anti-aliasing.

## Full-Grid 1080p Output Framing

The engine should support a standard **1920 × 1080** output canvas.

For a landscape output, the matrix should be treated as:

``` text
69 columns × 45 rows
```

The full **69 columns × 45 rows** matrix should be visible.

This means:

``` text
screen pixel size per logical pixel: 1080 / 45 = 24 exactly
```

Pixels must remain square.

Therefore the full logical image becomes:

``` text
width: 69 × 24 = 1656 px
height: 1080 px
```

The renderer should therefore provide a **full-grid 1080p viewport mode**:

``` text
canvas: 1920 × 1080
logical grid: 69 × 45
scale: 1080 / 45 = 24
active image: 1656 × 1080
horizontal position: centered
vertical position: centered
visible result: complete 69 × 45 grid (notch rendered black) with black side fields
background: black where no image exists, including the notch
```

In this mode, preserving the full 69 × 45 square grid takes priority over
filling the entire 1920 px output width.

No blur.

------------------------------------------------------------------------

# Output Modes

## Fullscreen Preview

For development and testing.

## Windowed Preview

For editing and debugging.

## External Output

The rendered framebuffer should be available to:

-   TouchDesigner
-   Resolume
-   MadMapper
-   OBS

Preferred output technologies:

-   Syphon (macOS)
-   Spout (Windows)

Fallbacks:

-   NDI
-   WebSocket

The engine itself should never perform projection mapping.

Projection correction, masks and warping belong to TouchDesigner or
Resolume.

------------------------------------------------------------------------

# Suggested Project Structure

``` text
engine/
modules/
renderer/
output/
ui/
utilities/
palettes/
```

Adding a new module should require minimal boilerplate.

------------------------------------------------------------------------

# UI

Simple and expandable.

Left:

-   module browser

Right:

-   parameters

Bottom:

-   FPS
-   resolution
-   active output

Future:

-   presets
-   favorites
-   search
-   random module
-   recording

------------------------------------------------------------------------

# Development Philosophy

Think of this project as a **creative coding framework**, similar in
spirit to Processing, p5.js or TouchDesigner.

Prioritize:

-   readability
-   modularity
-   experimentation
-   extensibility

over premature optimization.

The codebase should encourage rapid prototyping of new behaviours.

------------------------------------------------------------------------

# Long-Term Goal

The final result should not be "software for one exhibition".

It should become a reusable **Pixel Engine** containing dozens or
hundreds of procedural behaviours, creatures, simulations and visual
experiments that can continue growing long after the first installation
is finished.
