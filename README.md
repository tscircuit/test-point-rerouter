# test-point-rerouter

Standalone test-point placement and local trace rerouting for tscircuit. The solver consumes an SRJ-compatible board, adds probe targets to explicitly designated traces, and returns the changed routes, pad obstacles and target coordinates. Runtime dependencies are `@tscircuit/solver-utils` and `graphics-debug`; the capacity autorouter is not required.

```ts
import { TestPointSolver } from "@tscircuit/test-point-rerouter"

const solver = new TestPointSolver(routedBoard, {
  requests: [
    { name: "TP_SDA", pcbTraceId: "source_net_33_mst0_0", layer: "bottom", diameter: 1 },
  ],
  clearance: 0.2,
  minProbeSpacing: 2.54,
  maxDetour: 1,
})
solver.solve()
const { traces, obstacles, testPoints } = solver.getOutput()
```

All dimensions are millimeters. The deterministic search tries inline locations before bounded local detours. Pads and changed copper are checked against other routes, vias, obstacles, board edges and other probe targets. Unplaceable requests fail explicitly. Input objects and unselected traces are preserved. Callers supply complete copper/obstacle geometry and component envelopes for probe access. The caller's additional metadata is preserved in the typed output.

This prototype handles outer-layer wire/via routes. It does not generate inner-layer breakout vias, perform global rip-up or design fixture mechanics. Core materializes the results as electrically connected, exposed PCB pads. Bottom-side targets remain in board coordinates (+X right, +Y up), without fixture mirroring.

## Real-board prototype

The tests and debugger use [astra/pd-power-supply](https://tscircuit.com/astra/pd-power-supply), pinned release `57387f49-bd91-4277-8a82-706b1575c5ed`: 219 traces, four layers, 80 × 45 mm. Three 1 mm bottom pads are added for SDA, SCL and OUTPUT_EN.

![PD power supply with generated probe targets](docs/test-point-images/pd-power-supply-before-after.png)

The committed before/after snapshot shows the actual bottom copper with magenta rings and named callouts marking all three added pads. The rings are enlarged review annotations; the pads remain 1 mm. The prototype exporter independently runs `@tscircuit/checks` against the emitted Circuit JSON. Full routing/placement checks and explicit 0.2 mm pad/pad, pad/trace and via/pad checks must introduce no findings. The comparison preserves finding type, object references and measured geometry; it does not just compare totals. A negative-control test deliberately shorts a generated pad to an unrelated via and verifies detection. See [algorithm and fixture details](docs/test-point-reroute.md).

## Development

```sh
bun install
bun test
bun run typecheck
bun run build
bun start
bun run prototype ./test-point-artifacts
```

`bun start` opens the step-by-step Cosmos debugger. `bun run prototype <directory>` exports the actual board as PNG/SVG, the resulting routing JSON, and probe targets. `bun scripts/prepare-test-point-board.ts` rebuilds the pinned input fixture from the published board.

Repository provisioning: [create-repo #102](https://github.com/tscircuit/create-repo/pull/102). Integration: [props #963](https://github.com/tscircuit/props/pull/963), [core #4974](https://github.com/tscircuit/core/pull/4974).

## Repository conventions

Bootstrapped from the [handbook](https://github.com/tscircuit/handbook/blob/main/guides/bootstrapping-repos.md) using [tscircuit/plop](https://github.com/tscircuit/plop) templates: Biome, Bun configuration, separate test/typecheck/format workflows, and the Cosmos config/decorator. The build workflow also uses the plop template, adapted to export the debugger. Generated frozen SRJ input is excluded from formatting.

This is a GitHub source package (`module` and exports point to `lib/index.ts`, published files are `lib`). There is no tsup artifact requirement or npm release dependency. Install from GitHub; consumers using a bundler compile the TypeScript source. Lockfile saving is disabled per the handbook. The debugger lives in `pages/` with explicit Vite and TypeScript aliases.

```sh
bun add github:tscircuit/test-point-rerouter
bun run format
bun run format:check
```

Until the implementation PR merges, use its branch or commit instead of `main`.
