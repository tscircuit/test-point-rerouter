import type { GraphicsObject, Line, Circle, Rect } from "graphics-debug"
import type { TestPointRoutingInput } from "./types"

/** Exact board coordinates; line widths and circle radii represent copper dimensions. */
export function getRoutingGraphics(
  input: TestPointRoutingInput,
): GraphicsObject & { circles: Circle[] } {
  const lines: Line[] = []
  const circles: Circle[] = []
  const rects: Rect[] = []
  const layerName = (layer: string): string =>
    layer === "top"
      ? "z0"
      : layer === "bottom"
        ? `z${input.layerCount - 1}`
        : `z${Number(layer.replace("inner", ""))}`
  const color = (layer: string): string =>
    layer === "top" ? "red" : layer === "bottom" ? "blue" : "#3a916c"
  for (const obstacle of input.obstacles) {
    const layer = `z${obstacle.layers.map((name) => layerName(name).slice(1)).join(",")}`
    if (obstacle.shape === "circle") {
      circles.push({
        center: obstacle.center,
        radius: Math.max(obstacle.width, obstacle.height) / 2,
        fill: "rgba(180,30,30,0.3)",
        layer,
      })
    } else {
      const angle = ((obstacle.ccwRotationDegrees ?? 0) * Math.PI) / 180
      rects.push({
        center: obstacle.center,
        width:
          Math.abs(Math.cos(angle)) * obstacle.width +
          Math.abs(Math.sin(angle)) * obstacle.height,
        height:
          Math.abs(Math.sin(angle)) * obstacle.width +
          Math.abs(Math.cos(angle)) * obstacle.height,
        fill: "rgba(180,30,30,0.3)",
        layer,
      })
    }
  }
  for (const trace of input.traces ?? []) {
    for (let i = 0; i < trace.route.length; i++) {
      const p = trace.route[i]!,
        q = trace.route[i + 1]
      if (p.route_type === "via") {
        circles.push({
          center: p,
          radius:
            (p.via_diameter ??
              input.minViaPadDiameter ??
              input.minViaDiameter ??
              0.6) / 2,
          fill: "blue",
          layer: `z${Array.from({ length: input.layerCount }, (_, z) => z).join(",")}`,
        })
      }
      if (
        !q ||
        (p.route_type !== "wire" && p.route_type !== "via") ||
        (q.route_type !== "wire" && q.route_type !== "via")
      )
        continue
      const from = p.route_type === "wire" ? p.layer : p.to_layer
      const to = q.route_type === "wire" ? q.layer : q.from_layer
      if (from !== to) continue
      const width = Math.max(
        p.route_type === "wire" ? p.width : 0,
        q.route_type === "wire" ? q.width : 0,
        input.minTraceWidth,
      )
      lines.push({
        points: [p, q],
        strokeColor: color(from),
        strokeWidth: width,
        layer: layerName(from),
        ...(from === "top" ? {} : { strokeDash: "0.2 0.15" }),
      })
    }
  }
  const b = input.bounds
  lines.push({
    points: [
      { x: b.minX, y: b.minY },
      { x: b.maxX, y: b.minY },
      { x: b.maxX, y: b.maxY },
      { x: b.minX, y: b.maxY },
      { x: b.minX, y: b.minY },
    ],
    strokeColor: "#888",
    strokeWidth: 0.05,
  })
  return { lines, circles, rects }
}
