import { expect, test } from "bun:test"
import { compareBoardDrc } from "./fixtures/compareBoardDrc"
import {
  applyTestPointsToCircuit,
  loadPdPowerSupplyCircuit,
  solvePdPowerSupply,
} from "./fixtures/pdPowerSupply"

test("DRC regression guard catches a generated pad shorted to unrelated copper", async () => {
  const before = loadPdPowerSupplyCircuit()
  const after = applyTestPointsToCircuit(
    before,
    solvePdPowerSupply().getOutput(),
  )
  const generatedPad = after.filter((e) => e.type === "pcb_smtpad").at(-3)!
  const unrelatedVia = after.find(
    (e) => e.type === "pcb_via" && e.pcb_via_id === "pcb_via_0",
  )!
  if (
    generatedPad.type !== "pcb_smtpad" ||
    generatedPad.shape !== "circle" ||
    unrelatedVia.type !== "pcb_via"
  )
    throw new Error("Missing fixture copper")
  generatedPad.x = unrelatedVia.x
  generatedPad.y = unrelatedVia.y
  const report = await compareBoardDrc(before, after)
  expect(
    report.suites.find((suite) => suite.name === "viaPad")!.added.length,
  ).toBeGreaterThan(0)
  expect(JSON.stringify(report.added)).toContain(generatedPad.pcb_smtpad_id)
})
