/** Board-world points in mm: +X right, +Y up; layer identifies the PCB face. */
export type Point = { x: number; y: number }
export type Wire = Point & {
  route_type: "wire"
  width: number
  layer: string
  start_pcb_port_id?: string
  end_pcb_port_id?: string
}
export type Via = Point & {
  route_type: "via"
  from_layer: string
  to_layer: string
  layers?: string[]
  via_diameter?: number
  via_hole_diameter?: number
}
/** Unsupported markers are accepted at the boundary and explicitly rejected. */
export type RoutingTrace = {
  type: "pcb_trace"
  pcb_trace_id: string
  connection_name: string
  route: Array<Wire | Via | { route_type: "jumper" | "through_obstacle" }>
}
export type RoutingObstacle = {
  type: "rect"
  obstacleId?: string
  shape?: "circle"
  center: Point
  width: number
  height: number
  layers: string[]
  connectedTo: string[]
  ccwRotationDegrees?: number
}
/** Structural SRJ-compatible input. The algorithm has no capacity-autorouter dependency.
 * Callers must include all relevant copper and probe-access component envelopes.
 * Additional caller metadata is retained by cloning the input.
 */
export type TestPointRoutingInput = {
  layerCount: number
  minTraceWidth: number
  minBoardEdgeClearance?: number
  minTraceToPadEdgeClearance?: number
  minPadEdgeToPadEdgeClearance?: number
  minViaEdgeToPadEdgeClearance?: number
  minTraceToHoleEdgeClearance?: number
  minViaPadDiameter?: number
  minViaDiameter?: number
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
  outline?: Point[]
  obstacles: RoutingObstacle[]
  traces?: RoutingTrace[]
  connections?: unknown[]
}
