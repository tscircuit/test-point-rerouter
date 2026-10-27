import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally } from "stack-svgs"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"
import type { RoutedTestPoint } from "../../lib/TestPointSolver"

/** Review annotations are separate from the emitted manufacturing geometry. */
export function getBoardComparisonSvg(
  before: AnyCircuitElement[],
  after: AnyCircuitElement[],
  points: RoutedTestPoint[],
): string {
  const db = su(structuredClone(after))
  for (const [index, point] of points.entries()) {
    const anchor = {
      x: point.x + (index === 2 ? -7 : 7),
      y: point.y - (index === 0 ? 4 : 3),
    }
    // Magenta rings are deliberately enlarged markers, not copper pad diameters.
    db.pcb_note_path.insert({
      route: Array.from({ length: 49 }, (_, i) => ({
        x: point.x + 1.15 * Math.cos((i * Math.PI) / 24),
        y: point.y + 1.15 * Math.sin((i * Math.PI) / 24),
      })),
      layer: "bottom",
      stroke_width: 0.24,
      color: "#db007c",
    })
    db.pcb_note_path.insert({
      route: [point, anchor],
      layer: "bottom",
      stroke_width: 0.12,
      color: "#db007c",
    })
    db.pcb_note_text.insert({
      text: point.name,
      anchor_position: anchor,
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 1.05,
      layer: "bottom",
      color: "#db007c",
    })
  }
  const renderPanel = (
    circuit: AnyCircuitElement[],
    title: string,
    subtitle: string,
  ): string => {
    const board = convertCircuitJsonToPcbSvg(circuit, {
      layer: "bottom",
      width: 1000,
      height: 562.5,
      matchBoardAspectRatio: true,
      drawPaddingOutsideBoard: false,
      showFabricationNotes: false,
      shouldDrawRatsNest: false,
      showPcbNotes: true,
      backgroundColor: "white",
      colorOverrides: {
        copper: { bottom: "#64748b", top: "#94a3b8" },
        drill: "#ffffff",
        substrate: "#f8fafc",
        boardOutline: "#94a3b8",
      },
    })
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="680" viewBox="0 0 1040 680"><rect width="1040" height="680" fill="white"/><text x="20" y="34" font-family="sans-serif" font-size="24" font-weight="700" fill="#152238">${title}</text><text x="20" y="62" font-family="sans-serif" font-size="16" fill="#475569">${subtitle}</text><g transform="translate(20 86)">${board}</g><text x="20" y="665" font-family="sans-serif" font-size="15" fill="#475569">astra/pd-power-supply · bottom copper · 80 × 45 mm · same board coordinates</text></svg>`
  }
  return stackSvgsHorizontally(
    [
      renderPanel(
        before,
        "BEFORE",
        "Published board — no generated probe pads",
      ),
      renderPanel(
        db.toArray(),
        "AFTER — 3 TEST POINTS ADDED",
        "Magenta rings + labels = added 1 mm pads (rings enlarged for visibility)",
      ),
    ],
    { gap: 20, normalizeSize: false },
  )
}
