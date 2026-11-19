# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Amper-Sum" — a browser puzzle game (game-jam entry, "machines" theme) built with **KAPLAY** (`kaplay@4000.0.0-alpha`) + TypeScript + Vite. The player places/rotates wire tiles on a grid so current flows from a start gate to end gate(s) with the summed modifier value equal to the level's `targetModifier`.

## Commands

```sh
npm run dev      # Vite dev server on http://localhost:3001
npm run build    # bundle to dist/ (kaplay split into its own chunk, sourcemaps on)
npm run preview  # serve the built dist/
npm run zip      # build + zip dist/ for itch.io etc.
```

There are no tests, no linter, and no type-check script (TypeScript isn't a dependency; Vite only strips types, and `tsconfig` has `strict: false`). Pushing a `v*` tag triggers `.github/workflows/release.yml`, which builds and attaches `amper-sum-build.zip` to a GitHub release.

## Architecture

- **Single KAPLAY instance** `k` is created in [src/constants.ts](src/constants.ts) with `global: false` — always call KAPLAY APIs via `k.` (import `k` from constants), never as globals. `constants.ts` also holds all tags, event names, colors, layout sizes, and the mutable global `gameState` (`won`, `levels`, `currentLevel`, `highestUnlockedLevel`).
- **Boot** ([src/main.ts](src/main.ts)): inits the optional Wavedash SDK (`window.WavedashJS`), loads fonts/shader, registers every wire type into `wireDictionary`, registers sounds with the `audio` manager, sets layers (`background`, `game`, `ui`, `transition`), loads progress from localStorage, then registers scenes `main-menu` and `game`.
- **Wire types**: a wire's type string (e.g. `wire-l`, `wire-modifier-plus`, `wire-i-req`) is a tag constant in `constants.ts` and its `WireDefinition` (atlas frame + `flow`) is registered in `initializeWireDictionary()` in `main.ts`. Adding a new piece means: add a tag constant, add a dictionary entry, and add art to `public/sprites/atlas.png`.
  - `flow` is `[Top, Right, Bottom, Left]` of `ConnectionType` (None/Inlet/Outlet/Both). Rotation `rot` (0–3, clockwise steps of 90°) is applied by `getRotatedConnections` in [src/utils.ts](src/utils.ts).
  - `modifier` adds to the running sum. Types containing `-req` are *requirements*: the path only passes through if the running sum ≥ their modifier, and they add nothing themselves.
- **Win check** (`checkWireLineValid` in [src/core/gameplay.ts](src/core/gameplay.ts)): DFS from the start wire across in-grid wires, respecting inlet/outlet direction, tracking a per-branch running sum (T-pieces split branches). Sums reaching each end gate are totaled and compared to `targetModifier`. It also recolors wires to show connected vs. disconnected. Called after every rotation animation and drop in [src/scenes/game-scene.ts](src/scenes/game-scene.ts).
- **Grid constraints** ([src/core/grid.ts](src/core/grid.ts)): `gridConstraints` is a `Map` keyed by `"x,y"` (`getPosKey`). Every cell defaults to `canPlace/canRotate: true`; level `cells` override this. `canPlaceAt` has special rules for modifier types — a modifier cell only accepts the same type with a matching modifier (or any modifier if the constraint's modifier is 0). Cells with `placeholder: true` show a placeholder frame and expect the player to drop the matching piece.
- **Interaction**: wires are KAPLAY game objects composed from custom components in [src/components/](src/components/) (`wireState` holds `wireData` and `rotateCW`; `drag`/`wireInteraction` emit `EVENT_Wire*` events). The game scene listens to those events with `k.on(event, Tag_Wire, ...)` to handle click-to-rotate, drag from inventory/grid, and drop. `inventory` ([src/core/inventory.ts](src/core/inventory.ts)) is keyed by `type + modifier` via `getInventoryItemKey`.
- **Scenes** are factory functions returning async scene callbacks; the game scene resets module-level containers (`gridConstraints`, `inventory`, tweens) on each entry. Scene changes go through the hex transition in [src/core/transition.ts](src/core/transition.ts).

## Levels

Level data lives in `public/data/` and is fetched at runtime with `k.loadJSON` (served from `public/`, so no rebuild of code needed). `levelList.json` defines order; each `level-NN.json` follows `LevelData` in [src/types.ts](src/types.ts): `name`, `cols`, `rows`, `targetModifier`, `cells` (pre-placed/fixed pieces and constraints at `x,y`), and `inventory` (`type`, `count`, optional `modifier`). To add a level, create the JSON and append its name to `levelList.json`. Progress (`highestUnlockedLevel`) is persisted in localStorage under `amper-sum:progress`.
