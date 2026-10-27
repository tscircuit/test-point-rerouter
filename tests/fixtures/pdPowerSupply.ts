import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, PcbTrace } from "circuit-json"
import {
  TestPointSolver,
  type TestPointOptions,
  type TestPointOutput,
} from "../../lib/TestPointSolver"
import type { TestPointRoutingInput } from "../../lib/types"
import input from "./astra-pd-power-supply.srj.json"
import { materializeRoutedTestPoints } from "./materialize-routed-test-points"

export const pdPowerSupplyInput = input as TestPointRoutingInput
export const pdPowerSupplyOptions: TestPointOptions = {
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

export function loadPdPowerSupplyCircuit(): AnyCircuitElement[] {
  return JSON.parse(
    gunzipSync(
      readFileSync(
        new URL("./astra-pd-power-supply.circuit.json.gz", import.meta.url),
      ),
    ).toString(),
  )
}

/** Test adapter: materialize emitted copper and source-connected probe pads for independent DRC. */
export function applyTestPointsToCircuit(
  circuit: AnyCircuitElement[],
  output: TestPointOutput,
): AnyCircuitElement[] {
  const db = su(structuredClone(circuit))
  for (const trace of output.traces!) {
    db.pcb_trace.update(trace.pcb_trace_id, {
      route: trace.route as PcbTrace["route"],
    })
  }
  materializeRoutedTestPoints(
    db,
    output.testPoints.map((p) => ({ ...p, sourceTraceId: p.connectionName })),
    "subcircuit_source_group_1",
  )
  return db.toArray()
}

export function solvePdPowerSupply(): TestPointSolver {
  const solver = new TestPointSolver(pdPowerSupplyInput, pdPowerSupplyOptions)
  solver.solve()
  return solver
}
