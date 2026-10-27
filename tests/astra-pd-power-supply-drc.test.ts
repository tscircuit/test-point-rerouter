import { expect, test } from "bun:test"
import { compareBoardDrc } from "./fixtures/compareBoardDrc"
import {
  applyTestPointsToCircuit,
  loadPdPowerSupplyCircuit,
  solvePdPowerSupply,
} from "./fixtures/pdPowerSupply"

// Full-board DRC runs multiple geometry checks before and after routing.
// Allow for CI runner variability beyond Bun's default five-second timeout.
test("actual emitted PD power supply pads and routes introduce no DRC findings", async () => {
  const before = loadPdPowerSupplyCircuit()
  const after = applyTestPointsToCircuit(
    before,
    solvePdPowerSupply().getOutput(),
  )
  const report = await compareBoardDrc(before, after)
  expect(report.added).toEqual([])
  expect(report.suites.map((suite) => suite.name)).toEqual([
    "routing",
    "placement",
    "padPad",
    "padTrace",
    "viaPad",
  ])
}, 30_000)
