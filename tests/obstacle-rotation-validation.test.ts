import { expect, test } from "bun:test"
import { TestPointSolver } from "../lib/TestPointSolver"
import type { TestPointRoutingInput } from "../lib/types"

test("rejects non-finite obstacle rotation instead of disabling collision checks", () => {
  const input: TestPointRoutingInput = {
    layerCount: 2,
    minTraceWidth: 0.2,
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    obstacles: [
      {
        type: "rect",
        center: { x: 0, y: 0 },
        width: 2,
        height: 2,
        layers: ["top"],
        connectedTo: [],
        ccwRotationDegrees: NaN,
      },
    ],
    connections: [],
    traces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "target",
        connection_name: "signal",
        route: [
          { route_type: "wire", x: -2, y: 0, width: 0.2, layer: "top" },
          { route_type: "wire", x: 2, y: 0, width: 0.2, layer: "top" },
        ],
      },
    ],
  }
  expect(
    () =>
      new TestPointSolver(input, {
        requests: [
          {
            name: "TP",
            pcbTraceId: "target",
            layer: "top",
            diameter: 0.5,
          },
        ],
        clearance: 0.2,
        minProbeSpacing: 2.54,
        maxDetour: 0,
      }),
  ).toThrow("obstacle")
})
