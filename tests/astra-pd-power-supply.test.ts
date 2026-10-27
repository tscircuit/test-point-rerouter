import { getBoardComparisonSvg } from "./fixtures/getBoardComparisonSvg"
import {
  loadPdPowerSupplyCircuit,
  applyTestPointsToCircuit,
} from "./fixtures/pdPowerSupply"
import { expect, test } from "bun:test"
import { TestPointSolver, type TestPointOptions } from "../lib/TestPointSolver"
import type { TestPointRoutingInput } from "../lib/types"
import input from "./fixtures/astra-pd-power-supply.srj.json"

export const boardTestPointOptions: TestPointOptions = {
  requests: [
    {
      name: "TP_SDA",
      pcbTraceId: "source_net_33_mst0_0",
      layer: "bottom",
      diameter: 1,
    },
    {
      name: "TP_SCL",
      pcbTraceId: "source_net_34_mst0_0",
      layer: "bottom",
      diameter: 1,
    },
    {
      name: "TP_OUTPUT_EN",
      pcbTraceId: "source_net_50_mst1_0",
      layer: "bottom",
      diameter: 1,
    },
  ],
  clearance: 0.2,
  minProbeSpacing: 2.54,
  maxDetour: 1,
}

test("adds bottom probe pads to designated traces on astra/pd-power-supply", async () => {
  const original = structuredClone(input as TestPointRoutingInput)
  const solver = new TestPointSolver(
    input as TestPointRoutingInput,
    boardTestPointOptions,
  )
  solver.solve()
  const output = solver.getOutput()
  expect(output.testPoints.map((p) => p.name)).toEqual([
    "TP_SDA",
    "TP_SCL",
    "TP_OUTPUT_EN",
  ])
  expect(output.traces).toHaveLength(219)
  expect(input as TestPointRoutingInput).toEqual(original)
  for (const trace of output.traces!) {
    const before = original.traces!.find(
      (t) => t.pcb_trace_id === trace.pcb_trace_id,
    )!
    const pad = output.testPoints.find(
      (p) => p.pcbTraceId === trace.pcb_trace_id,
    )
    if (!pad) {
      expect(trace).toEqual(before)
      continue
    }
    expect(trace.route).toHaveLength(before.route.length + 1)
    expect(trace.route[0]).toEqual(before.route[0])
    expect(trace.route.at(-1)).toEqual(before.route.at(-1))
    expect(
      trace.route.some(
        (p) =>
          p.route_type === "wire" &&
          p.x === pad.x &&
          p.y === pad.y &&
          p.layer === pad.layer,
      ),
    ).toBe(true)
  }
  const before = loadPdPowerSupplyCircuit()
  const after = applyTestPointsToCircuit(before, output)
  await expect(
    getBoardComparisonSvg(before, after, output.testPoints),
  ).toMatchSvgSnapshot(import.meta.path)
})
